import { System } from "../system";
import { Ticket } from "./base";

export interface HarvestTicket extends Ticket {
    type: 'harvest',
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
            type: 'harvest'
        }
        room.memory.tickets.push(ticket);
        return ticket;
    }
 }
