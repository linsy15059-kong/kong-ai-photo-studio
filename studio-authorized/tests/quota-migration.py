import sqlite3, re, pathlib
root=pathlib.Path(__file__).resolve().parent.parent
sql=(root/'drizzle/0000_eager_bullseye.sql').read_text().replace('--> statement-breakpoint','')
conn=sqlite3.connect(':memory:');conn.executescript(sql)
source=(root/'lib/usage.ts').read_text()
quota=re.search(r'db.prepare\(`(INSERT INTO daily_usage.*?)`\)',source,re.S).group(1)
conn.execute("INSERT INTO members(email,status,daily_limit,created_at,updated_at) VALUES('approved@gmail.com','approved',2,'now','now')")
def reserve(email,day='2026-10-12',owner=0):
 return conn.execute(quota,(email,day,owner,email,owner,email)).fetchone()
assert reserve('approved@gmail.com')==(1,)
assert reserve('approved@gmail.com')==(2,)
assert reserve('approved@gmail.com') is None
assert conn.execute('SELECT calls FROM daily_usage').fetchone()==(2,)
assert reserve('unknown@gmail.com') is None
conn.execute("UPDATE members SET status='suspended' WHERE email='approved@gmail.com'")
assert reserve('approved@gmail.com','2026-10-13') is None
conn.execute("UPDATE members SET status='approved' WHERE email='approved@gmail.com'")
assert reserve('approved@gmail.com','2026-10-13')==(1,)
for n in range(5):assert reserve('owner@gmail.com',owner=1)==(n+1,)
conn.execute("INSERT INTO tasks(id,user_id,email,tool,preset,created_at) VALUES('same','u','owner@gmail.com','carpet','wool','2026-10-12T00:00:00.000Z')")
try:
 conn.execute("INSERT INTO tasks(id,user_id,email,tool,preset,created_at) VALUES('same','u','owner@gmail.com','carpet','wool','2026-10-12T00:00:00.000Z')")
 raise AssertionError('Duplicate task must be rejected')
except sqlite3.IntegrityError:pass
finish=re.search(r'db.prepare\(`(UPDATE tasks SET.*?)`\)',source,re.S).group(1)
conn.execute(finish,('failed','2026-10-12T00:00:05.000Z','2026-10-12T00:00:05.000Z','credit_balance_exhausted','API balance exhausted',0,0,'same'))
status,duration=conn.execute('SELECT status,duration_ms FROM tasks WHERE id="same"').fetchone()
assert status=='failed' and abs(duration-5000)<2
conn.execute(finish,('success','2026-10-12T00:00:06.000Z','2026-10-12T00:00:06.000Z','','',100,100,'same'))
assert conn.execute('SELECT status FROM tasks WHERE id="same"').fetchone()==('failed',)
print('Passed: actual migration SQL, atomic daily caps, suspended-user denial, day reset, duplicate task key and terminal-state protection.')
