import { PoolTypeEnum } from './pool';
export type UserSimpleInfo = {
    id: number;
    name: string;
    phone: string;
};
export type PoolSimpleInfo = {
    id: number;
    name: string;
    type: PoolTypeEnum;
    taskCountDown?: {
        day?: number;
        hour?: number;
        minute?: number;
    };
    rejectTaskCountDown?: {
        day?: number;
        hour?: number;
        minute?: number;
    };
    operatorIDBlackList?: string[];
};
export type TeamSimpleInfo = {
    id: number;
    name: string;
};
