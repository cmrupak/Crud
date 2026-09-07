import {
  createLocalBackend,
  createMemoryStorage,
  DEMO_ACCOUNTS,
} from '../packages/shared/src/index.ts';

async function main() {
  const api = createLocalBackend(createMemoryStorage());

  const admin = await api.auth.login({
    email: DEMO_ACCOUNTS.admin.email,
    password: DEMO_ACCOUNTS.admin.password,
    rememberMe: true,
  });
  console.log('admin login', admin.role, admin.status);

  const rec = await api.records.create({
    title: 'Test record',
    description: 'Created by smoke test',
    status: 'active',
  });
  console.log('created', rec.id);

  const list = await api.records.listAll();
  console.log('admin records', list.total);

  await api.auth.logout();

  await api.auth.login({
    email: DEMO_ACCOUNTS.user.email,
    password: DEMO_ACCOUNTS.user.password,
    rememberMe: true,
  });
  const mine = await api.records.listMine();
  console.log('user records', mine.total);

  try {
    await api.admin.listUsers();
    console.log('FAIL: user accessed admin');
    process.exitCode = 1;
  } catch {
    console.log('user blocked from admin: ok');
  }

  console.log('SMOKE_OK');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
