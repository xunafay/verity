import {} from 'main';
import { HarvestTicket } from 'tickets/harvest';
import { Logger } from 'utils/logger';

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
                    Logger.debug('Found dead creap with ticket in working memory', 'System');
                    for (const room_name in Game.rooms) {
                        const rooms = Game.rooms[room_name];
                        const ticket = rooms.memory.tickets.find(ticket => ticket.assignees.includes(creep_name));
                        // remove from assignees
                        if (ticket) {
                            ticket.assignees.splice(ticket.assignees.indexOf(creep_name), 1);
                            Logger.debug(`Removing creep from ticket(${ticket.pid}) assignees`, 'System');
                            break;
                        }

                        // remove from reservations
                        (rooms.memory.tickets.filter(ticket => ticket.type == 'harvester') as HarvestTicket[]).forEach(ticket => delete ticket.reserved[creep_name]);
                    }
                }
                delete Memory.creeps[creep_name];
            }
        }
    }
}
