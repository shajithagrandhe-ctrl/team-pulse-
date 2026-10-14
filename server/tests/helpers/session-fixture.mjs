export const sessionFixture = (t, prisma) => {
  const original = prisma.authSession.findUnique;
  prisma.authSession.findUnique = async ({ where }) => ({
    id: where.id, userId: where.id, expiresAt: new Date(Date.now() + 60_000), revokedAt: null
  });
  t.after(() => { prisma.authSession.findUnique = original; });
};
