import { Logger } from "utils/logger";
import { HarvestingSite } from "utils/static-harvesting";
import { System } from "../system";
import { Ticket } from "./base";
import { HarvestTicket } from "./harvest";

export interface RoomUpgradeTicket extends Ticket {
    type: 'upgrade',
    targetControllerLevel: number,
}

export class RoomUpgradeTicketHelper {
    static create(room: Room): RoomUpgradeTicket {
        if (!room.controller) {
            throw new Error("Trying to create upgrade ticket for room without controller");
        }

        if (!room.controller.my) {
            throw new Error("Trying to create upgrade ticket for room controller of other player");
        }

        const targetLevel = room.controller.level + 1;

        let ticket: RoomUpgradeTicket = {
            assignees: [],
            maxAssignees: targetLevel,
            pid: System.getPid(),
            requestor: room.name,
            requirements: [WORK, CARRY, MOVE],
            targetControllerLevel: targetLevel,
            type: 'upgrade'
        };

        room.memory.tickets.push(ticket);

        return ticket
    }

    static run(creep: Creep) {
        if (!creep.room.controller) {
            Logger.error(`creep(${creep.name}) tried upgrading controller in room without controller`, 'UpgradeTicket');
            return;
        }

        if (creep.memory.work == null) {
            creep.memory.work = 'harvesting'
        }

        // search for energy sources in room
        const source = creep.room.find(FIND_SOURCES_ACTIVE)[0];
        // TODO: get closest source instead of first one

        // check if creep has to switch task
        if (creep.memory.work == 'harvesting' && creep.store.getFreeCapacity() == 0) {
            creep.memory.work = 'upgrading';
        } else if (creep.memory.work == 'upgrading' && creep.store.getUsedCapacity() == 0) {
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
        } else if (creep.memory.work == 'upgrading') {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
    }

    static isValid(ticket: RoomUpgradeTicket, room: Room): boolean {
        if (!room.controller) {
            return false;
        }

        return ticket.targetControllerLevel > room.controller.level;
    }
}
