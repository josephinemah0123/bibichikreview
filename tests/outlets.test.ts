import test from "node:test";
import assert from "node:assert/strict";
import { outlets, findOutlet } from "../config/outlets";
test("three canonical routes and aliases remain available",()=>{
 assert.equal(outlets.length,3);
 for(const outlet of outlets){assert.equal(findOutlet(outlet.slug)?.id,outlet.id);for(const alias of outlet.aliases) assert.equal(findOutlet(alias)?.id,outlet.id);}
 assert.equal(findOutlet("unknown"),undefined);
});
