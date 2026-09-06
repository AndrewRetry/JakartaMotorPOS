select setval(pg_get_serial_sequence('public.kategori','id'), (select max(id) from public.kategori), true);
select setval(pg_get_serial_sequence('public.supplier','id'), (select max(id) from public.supplier), true);
select setval(pg_get_serial_sequence('public.customer','id'), (select max(id) from public.customer), true);
select setval(pg_get_serial_sequence('public.barang','id'),   (select max(id) from public.barang),   true);