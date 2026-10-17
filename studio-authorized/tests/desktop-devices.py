import pathlib,sqlite3,tempfile,re,concurrent.futures,threading
root=pathlib.Path(__file__).resolve().parents[1]
lease=re.search(r'leaseSQL=`(.*?)`;', (root/'lib/desktop-license.ts').read_text(),re.S).group(1)
with tempfile.TemporaryDirectory() as tmp:
 path=tmp+'/test.db'
 db=sqlite3.connect(path)
 for file in sorted((root/'drizzle').glob('*.sql')):db.executescript(file.read_text())
 db.execute('PRAGMA journal_mode=WAL');db.commit();db.close()
 barrier=threading.Barrier(3)
 def claim(device,n=1000,wait=False):
  c=sqlite3.connect(path,timeout=10)
  if wait:barrier.wait()
  row=c.execute(lease,('customer@gmail.com',device,n+90,'customer@gmail.com',n,device,device,n)).fetchone();c.commit();c.close();return row
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  devices=['device-a','device-b','device-c']
  result=list(pool.map(lambda device:claim(device,wait=True),devices))
 assert sum(r is not None for r in result)==2,result
 active=devices[next(i for i,r in enumerate(result) if r)]
 for i in range(5):assert claim(active,1001)
 c=sqlite3.connect(path)
 assert c.execute('SELECT COUNT(*) FROM desktop_slots').fetchone()[0]==2
 denied=devices[next(i for i,r in enumerate(result) if r is None)]
 assert claim(denied,1080) is None
 assert claim(denied,1092) is not None
 assert c.execute('SELECT COUNT(*) FROM desktop_slots').fetchone()[0]==2
 # An unrelated customer has its own independent two-device capacity.
 assert c.execute(lease,('other@gmail.com','other-a',1200,'other@gmail.com',1110,'other-a','other-a',1110)).fetchone()
 c.commit()
 # Real session lookup: revoked licenses, expired tokens and suspended members fail closed.
 sql=re.search(r'prepare\(`(SELECT d\.\*.*?)`\)',(root/'lib/desktop-license.ts').read_text(),re.S).group(1)
 c.execute("INSERT INTO commercial_licenses(email,code_hash,status,created_at,activated_at) VALUES('customer@gmail.com','code','active','now','now')")
 c.execute("INSERT INTO members(email,name,status,created_at,updated_at) VALUES('customer@gmail.com','','approved','now','now')")
 c.execute("INSERT INTO desktop_devices(token_hash,email,device_id,name,created_at,expires_at) VALUES('token','customer@gmail.com','device-a','PC','now',2000)")
 assert c.execute(sql,('token',1200,'owner@gmail.com')).fetchone()
 assert not c.execute(sql,('token',2001,'owner@gmail.com')).fetchone()
 c.execute("UPDATE commercial_licenses SET status='revoked'")
 assert not c.execute(sql,('token',1200,'owner@gmail.com')).fetchone()
 c.execute("UPDATE commercial_licenses SET status='active'")
 c.execute("UPDATE members SET status='suspended'")
 assert not c.execute(sql,('token',1200,'owner@gmail.com')).fetchone()
 c.close()
print('PASS: simultaneous three-device race allows exactly two; renewals, expiry, account isolation, revoked and expired credentials verified.')
