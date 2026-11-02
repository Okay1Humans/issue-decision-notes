import { randomUUID } from 'node:crypto';
import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import Resolver from '@forge/resolver';
import {
  DEFAULT_MAX_LENGTH,
  UserError,
  addDecision,
  deleteDecision,
  issueRecordKey,
  updateDecision,
  validateMaxLength,
} from '../lib/decisions.js';

const SETTINGS_KEY = 'settings:maxLength';
const ADMIN_MODULE = 'decision-notes-admin';

const resolver = new Resolver();

const issueKeyFrom = (context) => {
  const key = context?.extension?.issue?.key;
  if (!key) throw new UserError('Open this panel from a Jira issue.');
  return key;
};

async function readIssue(issueKey) {
  const response = await api
    .asUser()
    .requestJira(route`/rest/api/3/issue/${issueKey}?fields=summary`);
  if (!response.ok) throw new UserError("You don't have access to this issue.");
  const issue = await response.json();
  return { key: issue.key, title: issue.fields.summary };
}

async function assertCanEdit(issueKey) {
  const response = await api
    .asUser()
    .requestJira(route`/rest/api/3/mypermissions?issueKey=${issueKey}&permissions=EDIT_ISSUES`);
  if (!response.ok) throw new UserError("You don't have access to this issue.");
  const body = await response.json();
  if (!body.permissions?.EDIT_ISSUES?.havePermission) {
    throw new UserError("You don't have permission to change this issue's decisions.");
  }
}

const getMaxLength = async () => (await kvs.get(SETTINGS_KEY)) ?? DEFAULT_MAX_LENGTH;
const getList = async (issueKey) => (await kvs.get(issueRecordKey(issueKey))) ?? [];

const safely = (handler) => async (request) => {
  try {
    return { ok: true, data: await handler(request) };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, message: error.message };
    console.error('Unexpected resolver error', error?.name);
    return { ok: false, message: 'Something went wrong. Please try again.' };
  }
};

resolver.define('load', safely(async ({ context }) => {
  const issueKey = issueKeyFrom(context);
  const issue = await readIssue(issueKey);
  return { issue, decisions: await getList(issueKey), maxLength: await getMaxLength() };
}));

resolver.define('add', safely(async ({ payload, context }) => {
  const issueKey = issueKeyFrom(context);
  await assertCanEdit(issueKey);
  const next = addDecision(
    await getList(issueKey),
    payload,
    await getMaxLength(),
    randomUUID(),
    new Date().toISOString(),
  );
  await kvs.set(issueRecordKey(issueKey), next);
  return next;
}));

resolver.define('update', safely(async ({ payload, context }) => {
  const issueKey = issueKeyFrom(context);
  await assertCanEdit(issueKey);
  const next = updateDecision(
    await getList(issueKey),
    payload?.id,
    payload,
    await getMaxLength(),
    new Date().toISOString(),
  );
  await kvs.set(issueRecordKey(issueKey), next);
  return next;
}));

resolver.define('remove', safely(async ({ payload, context }) => {
  const issueKey = issueKeyFrom(context);
  await assertCanEdit(issueKey);
  const next = deleteDecision(await getList(issueKey), payload?.id);
  await kvs.set(issueRecordKey(issueKey), next);
  return next;
}));

resolver.define('getSettings', safely(async () => ({ maxLength: await getMaxLength() })));

resolver.define('saveSettings', safely(async ({ payload, context }) => {
  if (context?.moduleKey !== ADMIN_MODULE) throw new UserError('Open this from the admin page.');
  const maxLength = validateMaxLength(payload?.maxLength);
  await kvs.set(SETTINGS_KEY, maxLength);
  return { maxLength };
}));

export const handler = resolver.getDefinitions();
