import { Ticket } from './tickets/base';

export class TicketManager {
    constructor(private room: Room) {}

    sortTickets(): Ticket[] {
        return this.room.memory.tickets.sort((a, b) => b.priority - a.priority);
    }
}
