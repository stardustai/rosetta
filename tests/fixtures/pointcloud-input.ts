import type { PublicAnnotationInput } from '../../src/annotation/schema';

// Older published point-cloud examples use matrix time frames and omit notes.
// Keep that protocol here; rebuilding it as a new-schema empty task hides
// regressions when existing annotations are opened in the standalone tool.
export const existingPointCloudInput = {
  taskParams: {
    type: 'include',
    value: {
      version: '1.0.0',
      record: {
        attachmentType: 'POINTCLOUD_SEQUENCE',
        attachment: [
          { name: '0.pcd', url: '/examples/street.pcd' },
          { name: '1.pcd', url: '/examples/street.pcd' },
        ],
        metadata: { title: '已有标注点云连续帧' },
      },
      operators: [
        {
          key: 'vehicle',
          label: '车辆',
          type: 'slotChildren',
          slotSpecification: {
            type: 'box3d',
            consistentSize: true,
            presetSizes: [
              { name: '轿车', geometry: { width: 2, height: 1.5, depth: 4 } },
            ],
          },
          children: [
            {
              key: 'category',
              label: '类别',
              type: 'input',
              inputSpecification: { type: 'select', items: ['轿车', '货车'] },
              inputOption: { required: true },
            },
          ],
        },
      ],
    },
  },
  taskResult: {
    annotations: [
      {
        key: 'vehicle',
        label: '车辆',
        type: 'slotChildren',
        slotsChildren: [
          {
            slot: {
              id: 'existing-box',
              type: 'box3d',
              label: '车辆',
              timeSeries: {
                0: {
                  type: 'appear',
                  value: [2, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1.5, 0, 10, 0, 0, 1],
                },
                1: {
                  type: 'appear',
                  value: [2, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1.5, 0, 11, 0, 0, 1],
                },
              },
            },
            children: [
              {
                key: 'category',
                label: '类别',
                type: 'input',
                input: {
                  type: 'select',
                  timeSeries: { 0: { type: 'appear', value: '轿车' } },
                },
              },
            ],
          },
        ],
      },
    ],
    hints: [],
    issues: [],
    metadata: {},
  },
} as unknown as PublicAnnotationInput;
