import { System } from "../system";
import { Ticket } from "./base";

export interface BuildTicket extends Ticket {
    id: string,
    type: 'build',
}

export class BuildTicketHelper {
    static create(room: Room, construction: ConstructionSite, maxAssignees: number): BuildTicket {
        let ticket: BuildTicket =  {
            id: construction.id,
            type: 'build',
            assignees: [],
            maxAssignees: maxAssignees,
            pid: System.getPid(),
            requestor: room.name,
            requirements: [WORK, CARRY, MOVE],
        };

        room.memory.tickets.push(ticket);
        return ticket;
    }

    static run(ticket: BuildTicket, creep: Creep) {
        if (creep.memory.work == null) {
            creep.memory.work = 'harvesting';
        }

        // search for sources in room
        const source = creep.room.find(FIND_SOURCES)[0];

        // check if creep has to switch task
        if (creep.memory.work == 'harvesting' && creep.store.getFreeCapacity() == 0) {
            creep.memory.work = 'building';
        } else if (creep.memory.work == 'building' && creep.store.getUsedCapacity() == 0) {
            creep.memory.work = 'harvesting';
        }

        // do task
        if (creep.memory.work == 'harvesting') {
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        } else if (creep.memory.work == 'building') {
            // find construction site from id in ticket
            const site = Game.getObjectById(ticket.id) as ConstructionSite;
            // do construction
            if (creep.build(site) == ERR_NOT_IN_RANGE) {
                creep.moveTo(site);
            }
        }
    }
}
