terraform {
  required_providers {
    coder = {
      source  = "coder/coder"
      version = ">= 2.0.0"
    }
    null = {
      source  = "hashicorp/null"
      version = ">= 3.0.0"
    }
  }
}

data "coder_provisioner" "me" {}
data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

# Pre-configured sprite from the pool
variable "sprite_name" {
  default     = "behave-data-platform"
  description = "Pre-configured sprite to use"
  type        = string
}

# Coder agent - runs on the pre-existing sprite
resource "coder_agent" "main" {
  arch = "amd64"
  os   = "linux"

  startup_script = <<-EOT
    #!/bin/bash
    echo "🚀 Workspace connecting..."

    # Pull latest code
    cd ~/workspace && git pull --ff-only || true

    # Ensure code-server is running
    if ! pgrep -f code-server > /dev/null; then
      PASSWORD=team2026 nohup code-server --bind-addr 0.0.0.0:8080 --auth password ~/workspace > /tmp/code-server.log 2>&1 &
    fi

    echo "✅ Ready!"
    echo "🌐 IDE: https://${var.sprite_name}-jmur.sprites.app"
    echo "🔑 Password: team2026"
    echo "🤖 Claude: run 'claude' in terminal"
  EOT

  env = {
    GIT_AUTHOR_NAME     = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
    GIT_AUTHOR_EMAIL    = data.coder_workspace_owner.me.email
    GIT_COMMITTER_NAME  = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
    GIT_COMMITTER_EMAIL = data.coder_workspace_owner.me.email
  }

  metadata {
    display_name = "Sprite"
    key          = "sprite"
    script       = "echo ${var.sprite_name}"
    interval     = 60
    timeout      = 1
  }

  metadata {
    display_name = "Claude Code"
    key          = "claude"
    script       = "claude --version 2>/dev/null || echo 'Not available'"
    interval     = 60
    timeout      = 5
  }
}

# Start Coder agent on the pre-existing sprite
resource "null_resource" "start_agent" {
  count = data.coder_workspace.me.start_count

  triggers = {
    workspace_id = data.coder_workspace.me.id
  }

  provisioner "local-exec" {
    command = <<-EOT
      # Start the Coder agent on the pre-configured sprite
      sprite -s ${var.sprite_name} exec -- /bin/bash -c '
        # Kill any existing agent
        pkill -f "coder agent" || true

        # Start the agent with the token
        export CODER_AGENT_TOKEN="${coder_agent.main.token}"
        export CODER_AGENT_URL="https://coder-control-plane-jmur.sprites.app"
        nohup coder agent > /tmp/coder-agent.log 2>&1 &

        echo "Coder agent started"
      '
    EOT
  }
}

# code-server app link
module "code-server" {
  count    = data.coder_workspace.me.start_count
  source   = "registry.coder.com/coder/code-server/coder"
  version  = "1.4.2"
  agent_id = coder_agent.main.id
  folder   = "/home/sprite/workspace"
}

# Display connection info
resource "coder_metadata" "info" {
  count       = data.coder_workspace.me.start_count
  resource_id = null_resource.start_agent[0].id

  item {
    key   = "IDE URL"
    value = "https://${var.sprite_name}-jmur.sprites.app"
  }

  item {
    key   = "Password"
    value = "team2026"
  }

  item {
    key   = "Console"
    value = "sprite console -s ${var.sprite_name}"
  }
}
