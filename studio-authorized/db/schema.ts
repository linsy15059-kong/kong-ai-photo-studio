import {sqliteTable,text,integer,index,primaryKey} from 'drizzle-orm/sqlite-core';
export const members=sqliteTable('members',{
 email:text('email').primaryKey(),name:text('name').notNull().default(''),status:text('status').notNull().default('pending'),dailyLimit:integer('daily_limit').notNull().default(30),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),grantedBy:text('granted_by').notNull().default(''),note:text('note').notNull().default(''),passwordHash:text('password_hash')
});
export const activity=sqliteTable('activity',{
 userId:text('user_id').primaryKey(),email:text('email').notNull(),name:text('name').notNull().default(''),lastSeen:text('last_seen').notNull(),page:text('page').notNull().default('workbench')
},t=>[index('activity_email_idx').on(t.email),index('activity_seen_idx').on(t.lastSeen)]);
export const tasks=sqliteTable('tasks',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),email:text('email').notNull(),tool:text('tool').notNull(),preset:text('preset').notNull(),status:text('status').notNull().default('running'),createdAt:text('created_at').notNull(),finishedAt:text('finished_at'),durationMs:integer('duration_ms'),errorCode:text('error_code').notNull().default(''),errorMessage:text('error_message').notNull().default(''),inputTokens:integer('input_tokens').notNull().default(0),outputTokens:integer('output_tokens').notNull().default(0),quality:text('quality').notNull().default('high')
},t=>[index('tasks_email_time_idx').on(t.email,t.createdAt),index('tasks_time_idx').on(t.createdAt),index('tasks_status_idx').on(t.status)]);
export const dailyUsage=sqliteTable('daily_usage',{
 email:text('email').notNull(),day:text('day').notNull(),calls:integer('calls').notNull().default(0)
},t=>[primaryKey({columns:[t.email,t.day]})]);
export const audit=sqliteTable('audit',{
 id:text('id').primaryKey(),actorEmail:text('actor_email').notNull(),action:text('action').notNull(),targetEmail:text('target_email').notNull(),detail:text('detail').notNull().default(''),createdAt:text('created_at').notNull()
},t=>[index('audit_time_idx').on(t.createdAt)]);

export const commercialLicenses=sqliteTable('commercial_licenses',{
 email:text('email').primaryKey(),codeHash:text('code_hash').notNull().unique(),status:text('status').notNull().default('active'),version:text('version').notNull().default('1'),createdAt:text('created_at').notNull(),activatedAt:text('activated_at'),note:text('note').notNull().default('')
});
export const desktopDevices=sqliteTable('desktop_devices',{
 tokenHash:text('token_hash').primaryKey(),email:text('email').notNull(),deviceId:text('device_id').notNull(),name:text('name').notNull(),createdAt:text('created_at').notNull(),expiresAt:integer('expires_at').notNull()
},t=>[index('desktop_devices_email_idx').on(t.email)]);
export const desktopSlots=sqliteTable('desktop_slots',{
 email:text('email').notNull(),slot:integer('slot').notNull(),deviceId:text('device_id').notNull(),expiresAt:integer('expires_at').notNull()
},t=>[primaryKey({columns:[t.email,t.slot]})]);
export const desktopPairs=sqliteTable('desktop_pairs',{
 id:text('id').primaryKey(),secretHash:text('secret_hash').notNull(),deviceId:text('device_id').notNull(),name:text('name').notNull(),expiresAt:integer('expires_at').notNull(),email:text('email')
});
export const desktopRate=sqliteTable('desktop_rate',{
 bucket:text('bucket').primaryKey(),calls:integer('calls').notNull(),expiresAt:integer('expires_at').notNull()
});
export const customerApiKeys=sqliteTable('customer_api_keys',{
 email:text('email').primaryKey(),encryptedKey:text('encrypted_key').notNull(),model:text('model').notNull().default('gpt-image-2'),updatedAt:text('updated_at').notNull()
});
export const webDevices=sqliteTable('web_devices',{
 email:text('email').notNull(),deviceId:text('device_id').notNull(),name:text('name').notNull().default('浏览器设备'),createdAt:text('created_at').notNull(),lastSeen:integer('last_seen').notNull()
},t=>[primaryKey({columns:[t.email,t.deviceId]}),index('web_devices_email_idx').on(t.email)]);
export const emailAuthCodes=sqliteTable('email_auth_codes',{
 email:text('email').primaryKey(),codeHash:text('code_hash').notNull(),expiresAt:integer('expires_at').notNull(),attempts:integer('attempts').notNull().default(0),requestedAt:integer('requested_at').notNull()
});
export const authSessions=sqliteTable('auth_sessions',{
 tokenHash:text('token_hash').primaryKey(),email:text('email').notNull(),createdAt:text('created_at').notNull(),expiresAt:integer('expires_at').notNull()
},t=>[index('auth_sessions_email_idx').on(t.email)]);
