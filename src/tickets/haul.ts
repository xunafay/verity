import { System } from "../system";
import { Ticket } from "./base";
import { HarvestTicket } from "./harvest";
import { HarvestingSite } from '../utils/static-harvesting';

export type Container = StructureContainer | StructureStorage | StructureSpawn | StructureExtension | StructureTower;

export interface HaulerTicket extends Ticket {
    type: 'hauler',
    target: string,
}

export class HaulerTicketHelper {
    static create(room: Room, target: string, maxAssignees: number): HaulerTicket {
        let ticket: HaulerTicket = {
            assignees: [],
            maxAssignees: maxAssignees,
            pid: System.getPid(),
            requestor: room.name,
            requirements: [WORK, CARRY, MOVE],
            target: target,
            type: 'hauler'
        }
        room.memory.tickets.push(ticket);
        return ticket;
    }

    static run(ticket: HaulerTicket, creep: Creep) {
        const source = creep.room.find(FIND_SOURCES_ACTIVE)[0];

        if (creep.memory.work == null && creep.store.getUsedCapacity() > 0) {
            creep.memory.work = 'dropping';
        } else if (creep.memory.work == null) {
            creep.memory.work = 'collecting';
        }

        // check if creep has to switch task
        if (creep.memory.work == 'collecting' && creep.store.getFreeCapacity() == 0) {
            creep.memory.work = 'dropping';
        } else if (creep.memory.work == 'dropping' && creep.store.getUsedCapacity() == 0) {
            creep.memory.work = 'collecting';
        }

        // do task
        if (creep.memory.work == 'collecting') {
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
                    const code = creep.withdraw(site.container, RESOURCE_ENERGY);
                    if (code == ERR_NOT_IN_RANGE) {
                        creep.moveTo(site.container);
                    } else if (code == OK) {
                        site.release(creep);
                    }
                } else if (site.creep) {
                    const code = site.creep.transfer(creep, RESOURCE_ENERGY);
                    if (code == ERR_NOT_IN_RANGE) {
                        creep.moveTo(site.creep);
                    } else if (code == OK) {
                        site.release(creep);
                    }
                }
            }
        } else if (creep.memory.work == 'dropping') {
            const target = Game.getObjectById(ticket.target) as Container;

            const code = creep.transfer(target, RESOURCE_ENERGY);
            if(code == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            } else if (code == ERR_FULL) {
                creep.room.memory.tickets.splice(creep.room.memory.tickets.indexOf(ticket), 1);
                creep.memory.ticket = undefined;
                creep.memory.work = undefined;
                // TODO: also unnasign other creeps from task
            }
        }
    }
}
