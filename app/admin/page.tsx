import { requireAdmin } from '@/lib/auth-guard';
import { listUsers, listSubscriptions } from '@/lib/db/queries';

export default async function AdminHomePage() {
  const user = await requireAdmin();

  const [users, subs] = await Promise.all([
    listUsers({ limit: 100 }),
    listSubscriptions({ limit: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Platform Overview</h2>
          <p className="text-muted-foreground">Monitor key metrics and system status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg border bg-background p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{users.length}</div>
            <div className="text-sm font-medium">Total Users</div>
            <div className="text-xs text-muted-foreground">Registered accounts</div>
          </div>
          <div className="rounded-lg border bg-background p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{subs.length}</div>
            <div className="text-sm font-medium">Active Subscriptions</div>
            <div className="text-xs text-muted-foreground">Paying customers</div>
          </div>
          <div className="rounded-lg border bg-background p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-2">Admin</div>
            <div className="text-sm font-medium">Your Role</div>
            <div className="text-xs text-muted-foreground">Access level: {user.role}</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/admin/users" className="rounded-lg border bg-background p-4 hover:bg-accent/50 transition-colors">
            <div className="text-sm font-medium">Manage Users</div>
            <div className="text-xs text-muted-foreground">View and edit user accounts</div>
          </a>
          <a href="/admin/models" className="rounded-lg border bg-background p-4 hover:bg-accent/50 transition-colors">
            <div className="text-sm font-medium">Configure Models</div>
            <div className="text-xs text-muted-foreground">Setup AI model preferences</div>
          </a>
          <a href="/admin/subscriptions" className="rounded-lg border bg-background p-4 hover:bg-accent/50 transition-colors">
            <div className="text-sm font-medium">View Subscriptions</div>
            <div className="text-xs text-muted-foreground">Monitor billing and plans</div>
          </a>
          <a href="/admin/settings" className="rounded-lg border bg-background p-4 hover:bg-accent/50 transition-colors">
            <div className="text-sm font-medium">System Settings</div>
            <div className="text-xs text-muted-foreground">Configure platform options</div>
          </a>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use the navigation sidebar to access all administrative functions. The platform is currently configured to use Groq models only.
        </p>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-muted-foreground">System operational - Groq provider active</span>
        </div>
      </div>
    </div>
  );
}
