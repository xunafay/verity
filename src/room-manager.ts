import { BuildTicketHelper } from "tickets/build";
import { RoomSpawnTicketHelper } from "tickets/spawn-creeps";
import { BuildTicket } from "tickets/build";
import { RoomUpgradeTicket, RoomUpgradeTicketHelper } from "tickets/upgrade";
import { RoomSpawnTicket } from "tickets/spawn-creeps";

export class RoomManager {
    constructor(public room: Room) {
        if (this.room.memory.tickets == null) {
            this.room.memory.tickets = [];
        }
    }

    createTickets(): void {
        this.createSpawnTickets();
        this.createConstructionTickets();
        this.createUpgradeTickets();
    }

    assignTickets(): void {
        this.room.find(FIND_MY_CREEPS).forEach(creep => {
            if (!creep.memory.ticket) {
                const ticket = this.room.memory.tickets.find(ticket => ticket.assignees.length < ticket.maxAssignees);
                if (ticket) {
                    ticket.assignees.push(creep.name);
                    creep.memory.ticket = ticket.pid;
                }
            }
        });
    }

    executeTickets(): void {
        for (const creep of this.room.find(FIND_MY_CREEPS)) {
            if (creep.memory.ticket) {
                const ticket = this.room.memory.tickets.find(ticket => ticket.pid == creep.memory.ticket);
                if (ticket && ticket.type == 'upgrade') {
                    RoomUpgradeTicketHelper.run(creep);
                } else if (ticket && ticket.type == 'build') {
                    BuildTicketHelper.run(ticket as BuildTicket, creep);
                } else {
                    console.log(`creep(${creep.name}) had non existing ticket(${creep.memory.ticket})`);
                    creep.memory.ticket = undefined;
                }
            }
        }

        let spawn_ticket = this.room.memory.tickets.find(ticket => {
            return ticket.type == 'spawnCreep'
        }) as RoomSpawnTicket | undefined;

        if (spawn_ticket != null) {
            RoomSpawnTicketHelper.run(this.room, spawn_ticket)
        }
    }

    private createSpawnTickets(): void {
        let creepCount = this.room.find(FIND_MY_CREEPS).length;
        creepCount += this.room.memory.tickets.filter(t => t.type == 'spawnCreeps').length;
        if (creepCount < ((this.room.controller?.level || 1) * 2) + 1) {
            RoomSpawnTicketHelper.create(this.room);
        }
    }

    private createConstructionTickets(): void {
        let buildTickets = this.room.memory.tickets.filter(ticket => ticket.type == 'build') as BuildTicket[]; // 1 road ticket
        let constructionSites = this.room.find(FIND_CONSTRUCTION_SITES); // 3 roads

        // filter constructionSites without ticket
        for (const ticket of buildTickets) {
            const site = constructionSites.find(site => site.id == ticket.id);
            if (site) {
                constructionSites.splice(constructionSites.indexOf(site), 1);
            }
        }

        // create ticket for those constructionSites
        for (const site of constructionSites) {
            BuildTicketHelper.create(this.room, site, 1)
        }
    }

    private createUpgradeTickets(): void {
        if (this.room.controller && this.room.controller.my) { // if room has controller and is owned by me
            const ticketExists = this.room.memory.tickets.some(ticket => ticket.type == 'upgrade');
            if (!ticketExists) {
                RoomUpgradeTicketHelper.create(this.room);
            }
        }
    }

    cleanUpTickets(): void {
        // delete invalid upgrade tickets
        for (const ticket of this.room.memory.tickets) {
            if (ticket.type == 'upgrade') {
                if (!RoomUpgradeTicketHelper.isValid(ticket as RoomUpgradeTicket, this.room)) {
                    console.log('[INFO] deleting invalid ticket: ' + ticket.pid);
                    const index = this.room.memory.tickets.indexOf(ticket);
                    this.room.memory.tickets.splice(index, 1);
                }
            }
        }

        // TODO: delete invalid build tickets

    }
}
