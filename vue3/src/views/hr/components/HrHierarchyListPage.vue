<template>
  <aw-setting-page>
    <template #toolbar>
      <aw-setting-toolbar
        :add-text="config.newLabel"
        :back-text="`返回${config.title}`"
        show-add
        @add="router.push(`${config.route}?action=new`)"
        @back="router.push('/hr')"
        @refresh="loadData"
      />
    </template>

    <aw-setting-split-page>
      <template #tree>
        <aw-setting-tree
          :add-title="rootAddTitle"
          :active-key="activeRootKey"
          :items="treeItems"
          show-add
          :title="treeTitle"
          @add="openRootModal"
          @select="selectRoot"
        />
      </template>

      <aw-setting-list-card
        v-model:keyword="keyword"
        :search-placeholder="searchPlaceholder"
        :title="activeRootTitle"
      >
        <aw-setting-table :columns="columns" :rows="filteredRows" @edit="openDetail">
          <template #cell="{ column, index, row }">
            <span v-if="column.key === 'index'">{{ index + 1 }}</span>
            <span v-else-if="column.key === 'name'" class="aw-link" @click="openDetail(row)">{{ row.name }}</span>
            <span v-else-if="column.key === 'status'" :class="['aw-status', statusTone(String(row.status || ''))]">{{ row.status }}</span>
            <span v-else>{{ row[column.key] }}</span>
          </template>
          <template #actions="{ row }">
            <span class="aw-link" @click="openDetail(row)">查看</span>
            <span class="aw-action-split">|</span>
            <span class="aw-link" @click="message = `${row.name} 已进入编辑对接队列`">编辑</span>
          </template>
        </aw-setting-table>
      </aw-setting-list-card>
    </aw-setting-split-page>

    <section v-if="message" class="aw-form-card hr-note">{{ message }}</section>

    <aw-setting-modal :open="rootModalOpen" :title="rootAddTitle" width="680px" @cancel="closeRootModal" @confirm="saveRoot">
      <div class="aw-form-grid">
        <label class="aw-field">
          <span>部门名称</span>
          <input v-model="rootForm.name" placeholder="请输入部门名称" />
        </label>
        <label class="aw-field">
          <span>部门编号</span>
          <input v-model="rootForm.code" placeholder="请输入部门编号" />
        </label>
        <label class="aw-field aw-field-full">
          <span>备注</span>
          <textarea v-model="rootForm.remark" placeholder="请输入备注"></textarea>
        </label>
      </div>
    </aw-setting-modal>
  </aw-setting-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { listHrRecords } from '@/app/api/hr/resources';
import type { HrModuleConfig, HrRecord } from '@/app/api/hr/types';
import AwSettingListCard from '@/components/setting-page/AwSettingListCard.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import AwSettingPage from '@/components/setting-page/AwSettingPage.vue';
import AwSettingSplitPage from '@/components/setting-page/AwSettingSplitPage.vue';
import AwSettingTable from '@/components/setting-page/AwSettingTable.vue';
import AwSettingToolbar from '@/components/setting-page/AwSettingToolbar.vue';
import AwSettingTree from '@/components/setting-page/AwSettingTree.vue';
import type { SettingTableColumn, SettingTableRow, SettingTreeItem } from '@/components/setting-page/types';

const props = defineProps<{ config: HrModuleConfig }>();
const router = useRouter();
const items = ref<HrRecord[]>([]);
const activeRootKey = ref<string | number>('');
const keyword = ref('');
const message = ref('');
const customRootItems = ref<string[]>([]);
const rootModalOpen = ref(false);
const rootForm = reactive({ name: '', code: '', remark: '' });

const treeTitle = computed(() => '部门列表');
const rootAddTitle = computed(() => '新增部门');
const searchPlaceholder = computed(() => '搜索分支部门名称/编号/负责人');
const activeRootTitle = computed(() => {
  const active = treeItems.value.find((item) => item.key === activeRootKey.value);
  return active?.label || '部门列表';
});
const columns = computed<SettingTableColumn[]>(() => [
  { key: 'index', label: '序号', width: '70px' },
  { key: 'name', label: '分支部门', width: '180px' },
  { key: 'parent', label: '所属部门', width: '150px' },
  { key: 'code', label: '部门编号', width: '170px' },
  { key: 'owner', label: '负责人', width: '120px' },
  { key: 'plan', label: '编制人数', width: '100px' },
  { key: 'actual', label: '在编人数', width: '100px' },
  { key: 'status', label: '状态', width: '100px' },
]);

const treeItems = computed<SettingTreeItem[]>(() => {
  const counts = items.value.reduce<Record<string, number>>((result, item) => {
    const key = rootKeyForRecord(item);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  const roots = Object.keys(counts);
  return [...roots, ...customRootItems.value]
    .filter(Boolean)
    .filter((root, index, all) => all.indexOf(root) === index)
    .map((root) => ({
      key: root,
      label: root,
      count: counts[root] || 0,
      icon: 'line-node',
    }));
});

const rows = computed<SettingTableRow[]>(() => items.value
  .filter((item) => rootKeyForRecord(item) === activeRootKey.value)
  .map((item) => ({
    id: item.id,
    sourceId: item.id,
    name: item.subject,
    parent: item.party,
    code: item.code,
    owner: item.owner || item.amount,
    plan: item.done,
    actual: item.left,
    status: item.status,
  })));

const filteredRows = computed(() => {
  const term = keyword.value.trim();
  if (!term) return rows.value;
  return rows.value.filter((row) => JSON.stringify(row).includes(term));
});

watch(() => props.config.resource, () => {
  activeRootKey.value = '';
  keyword.value = '';
  message.value = '';
  customRootItems.value = [];
  void loadData();
});

watch(treeItems, (next) => {
  if (!next.length) return;
  const active = next.find((item) => item.key === activeRootKey.value);
  const firstWithRows = next.find((item) => Number(item.count || 0) > 0);
  if (!active || (firstWithRows && Number(active.count || 0) === 0)) {
    activeRootKey.value = (firstWithRows || next[0]).key;
  }
}, { immediate: true });

async function loadData() {
  const result = await listHrRecords(props.config.resource, { pageNo: 1, pageSize: 100 });
  items.value = result.items;
}

function rootKeyForRecord(item: HrRecord) {
  return String(item.party || '未分级部门');
}

function selectRoot(key: string | number) {
  activeRootKey.value = key;
}

function openRootModal() {
  rootForm.name = '';
  rootForm.code = '';
  rootForm.remark = '';
  rootModalOpen.value = true;
}

function closeRootModal() {
  rootModalOpen.value = false;
}

function saveRoot() {
  const name = rootForm.name.trim();
  if (!name) {
    message.value = '请先填写部门名称。';
    return;
  }
  if (!customRootItems.value.includes(name)) {
    customRootItems.value = [...customRootItems.value, name];
  }
  activeRootKey.value = name;
  message.value = `${name} 已新增为部门，后续对接 ${props.config.resource} 正式新增接口。`;
  closeRootModal();
}

function openDetail(row: SettingTableRow) {
  router.push(`${props.config.route}?id=${encodeURIComponent(String(row.sourceId || row.id))}`);
}

function statusTone(status: string) {
  if (['启用', '在职', '正常', '已归档', '有效', '已通过'].includes(status)) return 'green';
  if (['停用', '冻结', '离职', '异常', '驳回', '已过期'].includes(status)) return 'red';
  return 'yellow';
}

onMounted(loadData);
</script>
