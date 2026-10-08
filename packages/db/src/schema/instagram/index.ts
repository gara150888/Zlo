import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { mediaTypeEnum, messageDirectionEnum } from "../enums";
import { user } from "../auth";

export const instagramAccount = pgTable("instagram_account", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  instagramId: text("instagram_id").notNull().unique(),
  username: text("username").notNull(),
  profilePicture: text("profile_picture"),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
},
  (table) => [
    index("instagram_account_user_id_idx").on(table.userId),
    index("instagram_account_instagram_id_idx").on(table.instagramId),
    index("instagram_account_user_id_is_active_idx").on(table.userId, table.isActive),
  ],
);

export const instagramMedia = pgTable("instagram_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  instagramAccountId: uuid("instagram_account_id")
    .notNull()
    .references(() => instagramAccount.id, { onDelete: "cascade" }),
  instagramMediaId: text("instagram_media_id").notNull().unique(),
  type: mediaTypeEnum("type").notNull(),
  caption: text("caption"),
  mediaUrl: text("media_url"),
  permalink: text("permalink"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
},
  (table) => [
    index("instagram_media_account_id_idx").on(table.instagramAccountId),
    index("instagram_media_account_id_created_at_idx").on(
      table.instagramAccountId,
      table.createdAt,
    ),
  ],
);

export const instagramComment = pgTable("instagram_comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  mediaId: uuid("media_id").notNull()
    .references(() => instagramMedia.id, {
      onDelete: "cascade",
    }),
  instagramCommentId: text("instagram_comment_id")
    .notNull()
    .unique(),
  instagramUserId: text("instagram_user_id").notNull(),
  username: text("username").notNull(),
  text: text("text").notNull(),
  parentCommentId: uuid("parent_comment_id"),
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
},
  (table) => [
    index("instagram_comment_media_id_idx").on(table.mediaId),
    index("instagram_comment_instagram_id_idx").on(table.instagramCommentId),
    index("instagram_comment_parent_id_idx").on(table.parentCommentId),
  ],
);

export const instagramMessage = pgTable("instagram_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  instagramAccountId: uuid("instagram_account_id")
    .notNull()
    .references(() => instagramAccount.id, { onDelete: "cascade" }),
  instagramMessageId: text("instagram_message_id").notNull().unique(),
  conversationId: text("conversation_id").notNull(),
  senderInstagramId: text("sender_instagram_id").notNull(),
  recipientInstagramId: text("recipient_instagram_id").notNull(),
  text: text("text").notNull(),
  direction: messageDirectionEnum("direction").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
},
  (table) => [
    index("instagram_message_account_id_idx").on(table.instagramAccountId),
    index("instagram_message_conversation_id_created_at_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    index("instagram_message_account_id_created_at_idx").on(
      table.instagramAccountId,
      table.createdAt,
    ),
  ],
);
