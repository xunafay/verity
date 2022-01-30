import { System } from "../system";
import { Ticket } from "./base";

export interface HarvestTicket extends Ticket {
    type: 'harvester',
    target: string,
}

export class HarvestTicketHelper {
    static create(room: Room, target: string, maxAssignees: number): HarvestTicket {
        let ticket: HarvestTicket = {
            assignees: [],
            maxAssignees: maxAssignees,
            pid: System.getPid(),
            requestor: room.name,
            requirements: [WORK, CARRY, MOVE],
            target: target,
            type: 'harvester',
            priority: 0
        }
        room.memory.tickets.push(ticket);
        return ticket;
    }

    static run(room: Room) {

    }
}
