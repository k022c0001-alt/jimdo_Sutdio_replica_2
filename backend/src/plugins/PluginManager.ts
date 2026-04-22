export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  routes?: any;
  onInstall?: () => void;
  onUninstall?: () => void;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin) {
    this.plugins.set(plugin.id, plugin);
    console.log(`Plugin registered: ${plugin.name} v${plugin.version}`);
  }

  unregister(id: string) {
    const plugin = this.plugins.get(id);
    if (plugin) {
      if (plugin.onUninstall) plugin.onUninstall();
      this.plugins.delete(id);
    }
  }

  get(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  isActive(id: string): boolean {
    return this.plugins.has(id);
  }
}

export const pluginManager = new PluginManager();
