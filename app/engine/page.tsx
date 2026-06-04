import { listRoles } from '@/lib/engine/roles'

export const dynamic = 'force-dynamic'

export default async function EngineDashboard() {
  const roles = await listRoles()
  return (
    <main style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Job Engine</h1>
      <p>{roles.length} role{roles.length === 1 ? '' : 's'} in the pipeline.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Company</th>
            <th style={{ textAlign: 'left' }}>Role</th>
            <th>Fit</th>
            <th>Route</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.id}>
              <td>{r.company}</td>
              <td>{r.title}</td>
              <td style={{ textAlign: 'center' }}>{r.fit_score ?? '—'}</td>
              <td style={{ textAlign: 'center' }}>{r.route ?? '—'}</td>
              <td style={{ textAlign: 'center' }}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {roles.length === 0 && <p style={{ marginTop: 16, opacity: 0.7 }}>No roles yet — sourcing comes in the next slice.</p>}
    </main>
  )
}
