import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany();
  console.table(users.map(u => ({id: u.id.slice(0,8)+"...", email: u.email, name: u.displayName, created: u.createdAt.toISOString().slice(0,10)})));
  
  console.log("\n=== FAMILY SPACES ===");
  const families = await prisma.familySpace.findMany();
  console.table(families.map(f => ({id: f.id.slice(0,8)+"...", name: f.name, created: f.createdAt.toISOString().slice(0,10)})));
  
  console.log("\n=== FAMILY MEMBERSHIPS ===");
  const memberships = await prisma.familyMembership.findMany({include: {user: true, familySpace: true}});
  console.table(memberships.map(m => ({user: m.user.displayName, family: m.familySpace.name, role: m.role})));
  
  console.log("\n=== BABIES ===");
  const babies = await prisma.baby.findMany();
  if (babies.length === 0) console.log("  (no babies yet)");
  else console.table(babies.map(b => ({id: b.id.slice(0,8)+"...", name: b.name, birthdate: b.birthdate?.toISOString().slice(0,10)})));
  
  console.log("\n=== INVITES ===");
  const invites = await prisma.invite.findMany();
  if (invites.length === 0) console.log("  (no invites yet)");
  else console.table(invites.map(i => ({email: i.emailNormalized, status: i.status})));
}
main().catch(console.error).finally(() => prisma.$disconnect());
