-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "welfare_place" VARCHAR(120) NOT NULL,
    "welfare_hours" VARCHAR(120) NOT NULL,
    "min_similarity" INTEGER NOT NULL DEFAULT 40,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- The only row, with the values the app used until now.
INSERT INTO "app_settings" ("id", "welfare_place", "welfare_hours", "min_similarity")
VALUES (1, 'Bienestar Estudiantil – Bloque C', 'Lunes a viernes, de 08:30 a 16:00', 40);