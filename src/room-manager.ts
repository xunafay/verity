import { BuildTicketHelper } from "tickets/build";
import { RoomSpawnTicketHelper } from "tickets/spawn-creeps";
import { BuildTicket } from "tickets/build";
import { RoomUpgradeTicket, RoomUpgradeTicketHelper } from "tickets/upgrade";
import { RoomSpawnTicket } from "tickets/spawn-creeps";
import { HaulerTicket, HaulerTicketHelper } from "tickets/haul";
import { Logger } from "utils/logger";
import { TicketManager } from 'ticket-manager';

export class RoomManager {
    ticketManager: TicketManager;

    constructor(public room: Room) {
        this.ticketManager = new TicketManager(this.room);
        if (this.room.memory.tickets == null) {
            this.room.memory.tickets = [];
        }
    }

    createTickets(): void {
        this.createSpawnTickets();
        this.createConstructionTickets();
        this.createUpgradeTickets();
        // this.createHaulingTickets();
    }

    assignTickets(): void {
        this.room.find(FIND_MY_CREEPS).forEach(creep => {
            if (!creep.memory.ticket) {
                const ticket = this.room.memory.tickets.find(ticket => ticket.assignees.length < ticket.maxAssignees);
                if (ticket) {
                    // clear memory before assigning new ticket
                    creep.memory = {} as CreepMemory;

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
                } else if (ticket && ticket.type == 'haul') {
                    HaulerTicketHelper.run(ticket as HaulerTicket, creep);
                } else {
                    Logger.warning(`creep(${creep.name}) had non existing ticket(${creep.memory.ticket})`, 'TicketExecutor');
                    creep.memory.ticket = undefined;
                }
            }
        }

        let spawn_ticket = this.room.memory.tickets.find(ticket => {
            return ticket.type == 'spawnCreeps'
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
            BuildTicketHelper.create(this.room, site, 1, 0)
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

    private createHaulingTickets(): void {
        const structures = (this.room.find(FIND_MY_STRUCTURES)
            .filter(s => s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) as Array<StructureExtension | StructureSpawn>)
            .filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

        for (const structure of structures) {
            const ticketExists = this.room.memory.tickets
                .some(ticket => ticket.type == 'haul' && (ticket as HaulerTicket).target == structure.id);
            if (!ticketExists) {
                HaulerTicketHelper.create(this.room, structure.id, Math.max(1, Math.floor(structure.store.getFreeCapacity(RESOURCE_ENERGY) / 50)));
            }
        }
    }

    cleanUpTickets(): void {
        // delete invalid upgrade tickets
        for (const ticket of this.room.memory.tickets) {
            if (ticket.type == 'upgrade') {
                if (!RoomUpgradeTicketHelper.isValid(ticket as RoomUpgradeTicket, this.room)) {
                    Logger.debug('deleting invalid/done upgrade ticket: ' + ticket.pid, 'TicketManager');
                    const index = this.room.memory.tickets.indexOf(ticket);
                    this.room.memory.tickets.splice(index, 1);
                }
            } else if (ticket.type == 'build') {
                if (Game.getObjectById((ticket as BuildTicket).id) == null) {
                    Logger.debug('[INFO] deleting invalid/done build ticket: ' + ticket.pid, 'TicketManager');
                    const index = this.room.memory.tickets.indexOf(ticket);
                    this.room.memory.tickets.splice(index, 1);
                }
            }
        }
    }
}
