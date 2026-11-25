import type { PublicAnnotationInput } from '../../src/annotation/schema';
import { sessionRecords } from '../../src/localData/sessionInfo';
import { assert, fixtureReport } from './report';
import { openDB } from 'idb';
import { buildLocalImport, localURL } from '../../src/localData/files';
import {
  storeImport,
  getLocalFile,
  saveSession,
  loadSession,
  deleteSession,
} from '../../src/localData/storage';

async function checkStorage() {
  const key = 'annotation-tool-storage-test';
  const report = fixtureReport('本地存储集成检查');
  const { pass } = report;
  try {
    const pending = sessionStorage.getItem(key);
    if (!pending) {
      const id = `test-${crypto.randomUUID()}`;
      const data = buildLocalImport(
        [
          {
            path: 'sequence/10.pcd',
            file: new File(['frame-ten'], '10.pcd'),
          },
          {
            path: 'sequence/2.pcd',
            file: new File(['frame-two'], '2.pcd'),
          },
        ],
        'pointcloud',
        true,
        id,
      );
      let progress = 0;
      await storeImport(data, new AbortController().signal, (value) => {
        progress = value;
      });
      assert(progress === 100, '导入进度应到达 100%');
      const input: PublicAnnotationInput = {
        taskParams: {
          type: 'multiple',
          operators: [],
          records: data.records,
        },
      };
      const session = await saveSession(input, id);
      assert(
        (
          sessionRecords(session.input)[0].attachment as Array<{ name: string }>
        )[0].name === '2.pcd',
        '连续帧自然排序错误',
      );

      const cancelledId = `${id}-cancelled`;
      const abort = new AbortController();
      const cancelled = buildLocalImport(
        [
          {
            path: 'cancel/1.pcd',
            file: new File(['cancel-one'], '1.pcd'),
          },
          {
            path: 'cancel/2.pcd',
            file: new File(['cancel-two'], '2.pcd'),
          },
        ],
        'pointcloud',
        false,
        cancelledId,
      );
      try {
        await storeImport(cancelled, abort.signal, () => abort.abort());
        throw new Error('取消导入没有终止');
      } catch (error) {
        assert(error.name === 'AbortError', '取消导入应返回 AbortError');
      }
      const db = await openDB('annotation-tool-local');
      assert(
        (await db.countFromIndex('files', 'importId', cancelledId)) === 0,
        '取消后仍留有原始文件',
      );
      assert(!(await db.get('imports', cancelledId)), '取消后仍留有导入记录');
      db.close();
      sessionStorage.setItem(key, id);
      location.reload();
    } else {
      const session = await loadSession(pending);
      assert(sessionRecords(session.input).length === 1, '刷新后任务丢失');
      pass('刷新后恢复任务与连续帧路径');
      const blob = await getLocalFile(localURL(pending, 'sequence/2.pcd'));
      assert((await blob.text()) === 'frame-two', 'IndexedDB 文件内容不一致');
      const url = URL.createObjectURL(blob);
      assert(
        (await (await fetch(url)).text()) === 'frame-two',
        'Blob URL 无法读取',
      );
      URL.revokeObjectURL(url);
      pass('刷新后从 IndexedDB 读取原始文件并解析为 Blob URL');
      pass('取消导入完整回滚文件与导入记录');
      await deleteSession(session.id);
      sessionStorage.removeItem(key);
      pass('清理本次检查创建的数据');
      report.complete();
    }
  } catch (error) {
    report.fail(error);
  }
}
checkStorage();
