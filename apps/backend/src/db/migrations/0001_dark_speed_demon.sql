ALTER TABLE "reordering_rules" DROP CONSTRAINT "reordering_rules_warehouse_id_locations_id_fk";
--> statement-breakpoint
ALTER TABLE "reordering_rules" ADD CONSTRAINT "reordering_rules_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;