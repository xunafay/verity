import { HarvestingSite } from "utils/static-harvesting";
import { System } from "../system";
import { Ticket } from "./base";
import { HarvestTicket } from "./harvest";

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

        // check if creep has to switch task
        if (creep.memory.work == 'harvesting' && creep.store.getFreeCapacity() == 0) {
            creep.memory.work = 'building';
        } else if (creep.memory.work == 'building' && creep.store.getUsedCapacity() == 0) {
            creep.memory.work = 'harvesting';
        }

        // do task
        if (creep.memory.work == 'harvesting') {
            let harvesting_tickets = creep.room.memory.tickets.filter(t => t.type == 'harvester') as Array<HarvestTicket>;
            let reservation = harvesting_tickets.find(t => t.reserved[creep.name] != null);
            if (!reservation) {
                let sites = harvesting_tickets.map(t => new HarvestingSite(t));
                let site = sites
                    .filter(s => s.reservationAvailable(creep.store.getFreeCapacity()))
                    .filter(s => s.distance(creep) != null)
                    .sort((a, b) => a.distance(creep)! - b.distance(creep)!)
                    .shift()

                if (site) {
                    site.reserve(creep);
                    reservation = site.ticket;
                }
            }

            if (reservation) {
                let site = new HarvestingSite(reservation);
                if (site.container) {
                    if (creep.withdraw(site.container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(site.container);
                    }
                } else if (site.creep) {
                    if (site.creep.transfer(creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(site.creep);
                    }
                }
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
