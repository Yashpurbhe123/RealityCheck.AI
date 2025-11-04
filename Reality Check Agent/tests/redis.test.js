import cxt_resp_cache_client from "../config/context_response_cache.config.js";
import cnt_resp_cache_client from "../config/content_response_cache.config.js";

const initCaches = async () => {
  await cxt_resp_cache_client.set("ping1", "pong1");
  console.log(await cxt_resp_cache_client.get("ping1"));
  console.log("Context Cache connected successfully");
  cxt_resp_cache_client.del("ping1")

  await cnt_resp_cache_client.set("ping2", "pong2");
  console.log(await cnt_resp_cache_client.get("ping2"));
  console.log("Content Cache connected successfully");
  cnt_resp_cache_client.del("ping2");
  
};

export default initCaches;
