import "dotenv/config";
import { randomBytes } from "crypto";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

function generateSecret(length = 20): string {
  return randomBytes(length).toString("base64url");
}

function generateBackupCodes(count = 10, length = 8): string {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(
      randomBytes(length).toString("hex").slice(0, length).toUpperCase(),
    );
  }
  return codes.join(",");
}

async function main() {
  const email = "damenaosan@gmail.com";
  const password = "Admin@123";
  const name = "Bhone Wai";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists.`);
    return;
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name,
      email,
      emailVerified: true,
      role: "ADMIN",
      twoFactorEnabled: true,
    },
  });

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: hashedPassword,
    },
  });

  // Create TwoFactor record so OTP verification works
  await prisma.twoFactor.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      secret: generateSecret(),
      backupCodes: generateBackupCodes(),
      verified: true,
    },
  });

  console.log(`Admin user created:`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role:     ADMIN`);
  console.log(`  2FA:      Enabled (OTP via email)`);
  console.log(`\n  Change the password after first login!`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
