import { Spin } from 'antd';

export function GlobalSpinner() {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <Spin />
    </div>
  );
}
