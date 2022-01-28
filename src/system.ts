import {} from './main';

export class System {
    static getPid(): number {
        if (Memory.pid == null) {
            Memory.pid = 0;
        }

        Memory.pid += 1;
        return Memory.pid;
    }

    static cleanUpMemory(): void {
        for (const creep_name in Memory.creeps) {
            if (!(creep_name in Game.creeps)) {
                // remove dead creeps from ticket assignees
                if (Memory.creeps[creep_name].ticket != null) {
                    for (const room_name in Game.rooms) {
                        const rooms = Game.rooms[room_name];
                        const ticket = rooms.memory.tickets.find(ticket => ticket.assignees.includes(creep_name));
                        if (ticket) {
                            ticket.assignees.splice(ticket.assignees.indexOf(creep_name), 1);
                            break;
                        }
                    }
                }
                delete Memory.creeps[creep_name];
            }
        }
    }
}
