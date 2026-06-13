import systemSeed from '@/mock/settings/system.json';
import permissionsSeed from '@/mock/settings/permissions.json';
import securitySeed from '@/mock/settings/security.json';
import dataSeed from '@/mock/settings/data.json';
import integrationsSeed from '@/mock/settings/integrations.json';
import guideSeed from '@/mock/settings/guide.json';
import type { SettingsCenterData } from './types';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let settingsData: SettingsCenterData = {
  system: clone(systemSeed) as SettingsCenterData['system'],
  permissions: clone(permissionsSeed) as SettingsCenterData['permissions'],
  security: clone(securitySeed) as SettingsCenterData['security'],
  data: clone(dataSeed) as SettingsCenterData['data'],
  integrations: clone(integrationsSeed) as SettingsCenterData['integrations'],
  guide: clone(guideSeed) as SettingsCenterData['guide'],
};

export function getSettingsCenterData(mode: 'mock' | 'remote' = 'mock') {
  if (mode === 'mock') return Promise.resolve(clone(settingsData));
  return Promise.resolve(clone(settingsData));
}

export function saveSettingsCenterData(data: SettingsCenterData, mode: 'mock' | 'remote' = 'mock') {
  settingsData = clone(data);
  if (mode === 'mock') return Promise.resolve(clone(settingsData));
  return Promise.resolve(clone(settingsData));
}
