import {} from './main';

export class System {
    static getPid(): number {
        Memory.pid += 1;
        return Memory.pid;
    }
}
