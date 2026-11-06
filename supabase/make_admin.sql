-- Corrige o erro "Sem permissão para alterar".
-- Cole no SQL Editor do Supabase e execute UMA vez.
-- Substitua o email pelo MESMO email do utilizador criado em Authentication → Users.

insert into public.admins (email)
values ('EMAIL-DO-AUTOR@exemplo.com')
on conflict do nothing;

-- Confirmar: deve listar o email do autor (igual ao que aparece em auth.users)
select a.email as admin, u.email as utilizador_supabase
from public.admins a
left join auth.users u on lower(u.email) = lower(a.email);
