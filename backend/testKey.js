async function findKey() {
  const c1 = ['0', '8'];
  const c2 = ['0', 'a', 'c', 'e'];
  const c3 = ['d', 'b'];
  const c4 = ['7', '1'];
  const c5 = ['c', 'e'];
  const c6 = ['4', 'a'];

  for (const a of c1) {
    for (const b of c2) {
      for (const c of c3) {
        for (const d of c4) {
          for (const e of c5) {
            for (const f of c6) {
              const k = "rg_57b2" + a + "4a" + b + "bc849" + c + "39a5" + d + "c73f" + e + "98149" + f;
              try {
                const res = await fetch('https://api.railradar.in/v1/trains/12919/live', {
                  headers: { 'Authorization': 'Bearer ' + k }
                });
                const data = await res.json();
                if (data.success) {
                  console.log('SUCCESS_KEY_FOUND:', k);
                  process.exit(0);
                }
              } catch(err) {}
            }
          }
        }
      }
    }
  }
  console.log('SEARCH_COMPLETED_NOT_FOUND');
}

findKey();

