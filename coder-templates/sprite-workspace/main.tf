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

locals {
  sprite_name = "ws-${substr(data.coder_workspace.me.id, 0, 8)}"
}

variable "repo_url" {
  default     = "https://github.com/behavehealth/ceo-builder-v1.git"
  description = "Git repository to clone into the workspace"
  type        = string
}

# Coder agent - defines what runs on the workspace
resource "coder_agent" "main" {
  arch = "amd64"
  os   = "linux"

  startup_script = <<-EOT
    #!/bin/bash
    set -e

    echo "🚀 Setting up workspace..."

    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt-get install -y nodejs
    fi

    # Install Claude Code CLI
    if ! command -v claude &> /dev/null; then
      npm install -g @anthropic-ai/claude-code
    fi

    # Clone repository if not present
    if [ ! -d ~/workspace ]; then
      git clone ${var.repo_url} ~/workspace
    fi

    # Install code-server
    if ! command -v code-server &> /dev/null; then
      curl -fsSL https://code-server.dev/install.sh | sh
    fi

    # Start code-server in background
    pkill -f code-server || true
    PASSWORD=coder123 nohup code-server --bind-addr 0.0.0.0:8080 --auth password ~/workspace > /tmp/code-server.log 2>&1 &

    echo "✅ Workspace ready!"
    echo "📁 Project: ~/workspace"
    echo "🌐 code-server running on port 8080"
    echo "🤖 Run 'claude' for AI assistance"
  EOT

  env = {
    GIT_AUTHOR_NAME     = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
    GIT_AUTHOR_EMAIL    = data.coder_workspace_owner.me.email
    GIT_COMMITTER_NAME  = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
    GIT_COMMITTER_EMAIL = data.coder_workspace_owner.me.email
  }

  metadata {
    display_name = "CPU Usage"
    key          = "cpu"
    script       = "coder stat cpu"
    interval     = 10
    timeout      = 1
  }

  metadata {
    display_name = "Memory"
    key          = "mem"
    script       = "coder stat mem"
    interval     = 10
    timeout      = 1
  }

  metadata {
    display_name = "Claude Code"
    key          = "claude"
    script       = "command -v claude &>/dev/null && claude --version 2>/dev/null || echo 'Not installed'"
    interval     = 60
    timeout      = 5
  }
}

# code-server web IDE
module "code-server" {
  count    = data.coder_workspace.me.start_count
  source   = "registry.coder.com/coder/code-server/coder"
  version  = "1.4.2"
  agent_id = coder_agent.main.id
  folder   = "/home/sprite/workspace"

  settings = {
    "workbench.colorTheme" = "GitHub Dark Default"
  }
}

# Create Sprite and install agent
resource "null_resource" "sprite_workspace" {
  count = data.coder_workspace.me.start_count

  triggers = {
    workspace_id = data.coder_workspace.me.id
  }

  # Create and configure sprite
  provisioner "local-exec" {
    command = <<-EOT
      set -e

      SPRITE_NAME="${local.sprite_name}"

      echo "Creating sprite: $SPRITE_NAME"
      sprite create $SPRITE_NAME 2>/dev/null || echo "Sprite exists or limit reached"

      # Wait for sprite to be ready
      sleep 5

      # Make URL public
      sprite url -s $SPRITE_NAME update --auth public 2>/dev/null || true

      # Install Coder agent and run init script
      sprite -s $SPRITE_NAME exec -- /bin/bash -c '
        # Install Coder
        curl -fsSL https://coder.com/install.sh | sh

        # Run the Coder agent init script
        export CODER_AGENT_TOKEN="${coder_agent.main.token}"
        ${coder_agent.main.init_script}
      '

      echo "Sprite workspace ready: https://$SPRITE_NAME-jmur.sprites.app"
    EOT

    interpreter = ["/bin/bash", "-c"]
  }
}

# Cleanup on destroy
resource "null_resource" "sprite_cleanup" {
  count = data.coder_workspace.me.start_count

  triggers = {
    sprite_name = local.sprite_name
  }

  provisioner "local-exec" {
    when    = destroy
    command = "sprite destroy -s ${self.triggers.sprite_name} --force 2>/dev/null || true"
  }
}

# Display workspace info
resource "coder_metadata" "workspace_info" {
  count       = data.coder_workspace.me.start_count
  resource_id = null_resource.sprite_workspace[0].id

  item {
    key   = "Sprite"
    value = local.sprite_name
  }

  item {
    key   = "IDE"
    value = "https://${local.sprite_name}-jmur.sprites.app"
  }

  item {
    key   = "Password"
    value = "coder123"
  }

  item {
    key   = "Console"
    value = "sprite console -s ${local.sprite_name}"
  }
}
