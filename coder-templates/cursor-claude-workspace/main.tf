terraform {
  required_providers {
    coder = {
      source = "coder/coder"
    }
    docker = {
      source = "kreuzwerker/docker"
    }
  }
}

locals {
  username = data.coder_workspace_owner.me.name
}

variable "docker_socket" {
  default     = ""
  description = "(Optional) Docker socket URI"
  type        = string
}

variable "repo_url" {
  default     = "https://github.com/behavehealth/ceo-builder-v1.git"
  description = "Git repository to clone"
  type        = string
}

provider "docker" {
  host = var.docker_socket != "" ? var.docker_socket : null
}

data "coder_provisioner" "me" {}
data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

resource "coder_agent" "main" {
  arch           = data.coder_provisioner.me.arch
  os             = "linux"
  startup_script = <<-EOT
    set -e

    # Initialize home directory
    if [ ! -f ~/.init_done ]; then
      cp -rT /etc/skel ~
      touch ~/.init_done
    fi

    # Install Node.js 20 if not present
    if ! command -v node &> /dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt-get install -y nodejs
    fi

    # Install Claude Code CLI
    if ! command -v claude &> /dev/null; then
      npm install -g @anthropic-ai/claude-code
      echo "✓ Claude Code CLI installed"
    fi

    # Clone the repository if not present
    if [ ! -d ~/workspace ]; then
      git clone ${var.repo_url} ~/workspace
      echo "✓ Repository cloned"
    fi

    # Pull latest changes
    cd ~/workspace && git pull --ff-only || true

    echo "🚀 Workspace ready! Connect with Cursor via SSH or use code-server in browser."
  EOT

  env = {
    GIT_AUTHOR_NAME     = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
    GIT_AUTHOR_EMAIL    = "${data.coder_workspace_owner.me.email}"
    GIT_COMMITTER_NAME  = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
    GIT_COMMITTER_EMAIL = "${data.coder_workspace_owner.me.email}"
  }

  metadata {
    display_name = "CPU Usage"
    key          = "0_cpu_usage"
    script       = "coder stat cpu"
    interval     = 10
    timeout      = 1
  }

  metadata {
    display_name = "RAM Usage"
    key          = "1_ram_usage"
    script       = "coder stat mem"
    interval     = 10
    timeout      = 1
  }

  metadata {
    display_name = "Claude Code"
    key          = "2_claude_code"
    script       = "command -v claude &> /dev/null && echo '✓ Installed' || echo '✗ Not found'"
    interval     = 60
    timeout      = 1
  }

  metadata {
    display_name = "Workspace"
    key          = "3_workspace"
    script       = "[ -d ~/workspace ] && echo '✓ Ready' || echo '✗ Not cloned'"
    interval     = 60
    timeout      = 1
  }
}

# code-server for browser-based VS Code
module "code-server" {
  count  = 1
  source = "registry.coder.com/coder/code-server/coder"

  agent_id = coder_agent.main.id
  folder   = "/home/${local.username}/workspace"

  settings = {
    "workbench.colorTheme" = "GitHub Dark Default"
    "editor.fontSize"      = 14
    "editor.tabSize"       = 2
  }
}

# Persistent home volume
resource "docker_volume" "home_volume" {
  name = "coder-${data.coder_workspace.me.id}-home"
  lifecycle {
    ignore_changes = all
  }
  labels {
    label = "coder.owner"
    value = data.coder_workspace_owner.me.name
  }
  labels {
    label = "coder.owner_id"
    value = data.coder_workspace_owner.me.id
  }
  labels {
    label = "coder.workspace_id"
    value = data.coder_workspace.me.id
  }
  labels {
    label = "coder.workspace_name_at_creation"
    value = data.coder_workspace.me.name
  }
}

# Docker container for the workspace
resource "docker_container" "workspace" {
  count = data.coder_workspace.me.start_count
  image = "codercom/enterprise-node:ubuntu"
  name  = "coder-${data.coder_workspace_owner.me.name}-${lower(data.coder_workspace.me.name)}"

  hostname = data.coder_workspace.me.name

  entrypoint = ["sh", "-c", coder_agent.main.init_script]

  env = [
    "CODER_AGENT_TOKEN=${coder_agent.main.token}",
  ]

  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }

  volumes {
    container_path = "/home/${local.username}"
    volume_name    = docker_volume.home_volume.name
    read_only      = false
  }

  labels {
    label = "coder.owner"
    value = data.coder_workspace_owner.me.name
  }
  labels {
    label = "coder.owner_id"
    value = data.coder_workspace_owner.me.id
  }
  labels {
    label = "coder.workspace_id"
    value = data.coder_workspace.me.id
  }
  labels {
    label = "coder.workspace_name"
    value = data.coder_workspace.me.name
  }
}

# SSH connection info for Cursor
resource "coder_metadata" "cursor_instructions" {
  count       = data.coder_workspace.me.start_count
  resource_id = docker_container.workspace[0].id

  item {
    key   = "Cursor SSH"
    value = "coder ssh ${data.coder_workspace.me.name}"
  }

  item {
    key   = "Claude Code"
    value = "ssh ${data.coder_workspace.me.name} 'cd ~/workspace && claude'"
  }
}
