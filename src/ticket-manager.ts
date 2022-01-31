import { Ticket } from './tickets/base';

export class TicketManager {
    constructor(private room: Room) {}

    sortTickets(): Ticket[] {
        return this.room.memory.tickets.sort((a, b) => b.priority - a.priority);
    }

    validTicketsForCreep(creep: Creep): Ticket[] {
        return this.sortTickets().filter(ticket => {
            const unique_body_parts: Array<BodyPartConstant> = [... new Set(creep.body.map(bodyPart => bodyPart.type))];
            return ticket.requirements.every(part => unique_body_parts.includes(part));
        });
    }

    unnasignedTickets(): Ticket[] {
        return this.sortTickets().filter(ticket => ticket.assignees.length < ticket.maxAssignees);
    }
}
