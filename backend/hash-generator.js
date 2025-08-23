import bcrypt from 'bcrypt';

async function generarHash(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Hash generado:', hash);
}

generarHash('Alex1986.');
