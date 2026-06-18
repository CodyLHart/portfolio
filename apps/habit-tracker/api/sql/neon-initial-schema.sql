CREATE TABLE IF NOT EXISTS "Users" (
  "Id" uuid PRIMARY KEY,
  "Provider" text NOT NULL,
  "ProviderSubject" text NOT NULL,
  "Email" text NOT NULL,
  "DisplayName" text NOT NULL,
  "AvatarUrl" text NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  "LastLoginAt" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Provider_ProviderSubject"
  ON "Users" ("Provider", "ProviderSubject");

CREATE TABLE IF NOT EXISTS "Habits" (
  "Id" uuid PRIMARY KEY,
  "UserId" uuid NOT NULL,
  "Name" text NOT NULL,
  "Icon" text NOT NULL,
  "TargetAmount" numeric NOT NULL,
  "Unit" text NOT NULL,
  "Frequency" text NOT NULL,
  "Color" text NOT NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  CONSTRAINT "FK_Habits_Users_UserId"
    FOREIGN KEY ("UserId")
    REFERENCES "Users" ("Id")
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_Habits_UserId"
  ON "Habits" ("UserId");

CREATE TABLE IF NOT EXISTS "HabitEntries" (
  "Id" uuid PRIMARY KEY,
  "HabitId" uuid NOT NULL,
  "Date" timestamp with time zone NOT NULL,
  "Amount" numeric NOT NULL,
  "Note" text NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  CONSTRAINT "FK_HabitEntries_Habits_HabitId"
    FOREIGN KEY ("HabitId")
    REFERENCES "Habits" ("Id")
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_HabitEntries_HabitId_Date"
  ON "HabitEntries" ("HabitId", "Date");
