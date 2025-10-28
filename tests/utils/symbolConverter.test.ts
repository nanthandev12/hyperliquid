// deno-lint-ignore-file no-import-prefix
import { HttpTransport } from "@nktkas/hyperliquid";
import { SymbolConverter } from "../../src/utils/_symbolConverter.ts";
import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";

Deno.test("SymbolConverter", async (t) => {
  await t.step("perpetuals", async (t) => {
    const transport = new HttpTransport();
    const converter = await SymbolConverter.create({ transport });

    await t.step("getAssetId", () => {
      const btcId = converter.getAssetId("BTC");
      const ethId = converter.getAssetId("ETH");

      assertEquals(btcId, 0, `BTC asset ID should be 0, but got ${btcId}`);
      assertEquals(ethId, 1, `ETH asset ID should be 1, but got ${ethId}`);
    });

    await t.step("getSzDecimals", () => {
      const btcDecimals = converter.getSzDecimals("BTC");
      const ethDecimals = converter.getSzDecimals("ETH");

      assertEquals(btcDecimals, 5, `BTC size decimals should be 5, but got ${btcDecimals}`);
      assertEquals(ethDecimals, 4, `ETH size decimals should be 4, but got ${ethDecimals}`);
    });

    await t.step("non-existent symbol", () => {
      const nonExistentId = converter.getAssetId("NONEXISTENT");
      const nonExistentDecimals = converter.getSzDecimals("NONEXISTENT");

      assertEquals(
        nonExistentId,
        undefined,
        `NONEXISTENT asset ID should be undefined, but got ${nonExistentId}`,
      );
      assertEquals(
        nonExistentDecimals,
        undefined,
        `NONEXISTENT size decimals should be undefined, but got ${nonExistentDecimals}`,
      );
    });
  });

  await t.step("spot markets", async (t) => {
    const transport = new HttpTransport();
    const converter = await SymbolConverter.create({ transport });

    await t.step("getAssetId", () => {
      const purrUsdcId = converter.getAssetId("PURR/USDC");
      const hypeUsdcId = converter.getAssetId("HYPE/USDC");

      assertEquals(purrUsdcId, 10000, `PURR/USDC asset ID should be 10000, but got ${purrUsdcId}`);
      assertEquals(hypeUsdcId, 10107, `HYPE/USDC asset ID should be 10107, but got ${hypeUsdcId}`);
    });

    await t.step("getSzDecimals", () => {
      const purrUsdcDecimals = converter.getSzDecimals("PURR/USDC");
      const hypeUsdcDecimals = converter.getSzDecimals("HYPE/USDC");

      assertEquals(purrUsdcDecimals, 0, `PURR/USDC size decimals should be 0, but got ${purrUsdcDecimals}`);
      assertEquals(hypeUsdcDecimals, 2, `HYPE/USDC size decimals should be 2, but got ${hypeUsdcDecimals}`);
    });

    await t.step("non-existent pair", () => {
      const noneExistentId = converter.getAssetId("NONE/EXISTENT");
      const noneExistentDecimals = converter.getSzDecimals("NONE/EXISTENT");

      assertEquals(
        noneExistentId,
        undefined,
        `NONE/EXISTENT asset ID should be undefined, but got ${noneExistentId}`,
      );
      assertEquals(
        noneExistentDecimals,
        undefined,
        `NONE/EXISTENT size decimals should be undefined, but got ${noneExistentDecimals}`,
      );
    });
  });

  await t.step("spot pair IDs", async (t) => {
    const transport = new HttpTransport();
    const converter = await SymbolConverter.create({ transport });

    await t.step("existing pair", () => {
      const hypeUsdcPairId = converter.getSpotPairId("HYPE/USDC");
      const purrUsdcPairId = converter.getSpotPairId("PURR/USDC");

      assertEquals(
        hypeUsdcPairId,
        "@107",
        `HYPE/USDC spot pair ID should be @107, but got ${hypeUsdcPairId}`,
      );
      assertEquals(
        purrUsdcPairId,
        "PURR/USDC",
        `PURR/USDC spot pair ID should be PURR/USDC, but got ${purrUsdcPairId}`,
      );
    });

    await t.step("non-existent pair", () => {
      const noneExistentPairId = converter.getSpotPairId("NONE/EXISTENT");
      const btcPairId = converter.getSpotPairId("BTC"); // not a spot market

      assertEquals(
        noneExistentPairId,
        undefined,
        `NONE/EXISTENT spot pair ID should be undefined, but got ${noneExistentPairId}`,
      );
      assertEquals(
        btcPairId,
        undefined,
        `BTC spot pair ID should be undefined, but got ${btcPairId}`,
      );
    });
  });

  await t.step("reload", async () => {
    const transport = new HttpTransport();
    const converter = await SymbolConverter.create({ transport });

    // Rewrite with other values to ensure reload works
    converter["nameToAssetId"].set("BTC", 9999);

    const btcIdBefore = converter.getAssetId("BTC");
    await converter.reload();
    const btcIdAfter = converter.getAssetId("BTC");

    assertNotEquals(
      btcIdBefore,
      btcIdAfter,
      `BTC asset ID should change after reload from ${btcIdBefore} to ${btcIdAfter}`,
    );
  });

  await t.step("builder dex", async (t) => {
    const transport = new HttpTransport({ isTestnet: true });

    await t.step("dexs: false", async () => {
      const converter = await SymbolConverter.create({ transport, dexs: false });

      const abcId = converter.getAssetId("test:ABC");
      assertEquals(abcId, undefined, `test:ABC asset ID should be undefined, but got ${abcId}`);
    });

    await t.step("dexs: [specific dex]", async () => {
      const converter = await SymbolConverter.create({ transport, dexs: ["test"] });

      const abcId = converter.getAssetId("test:ABC");
      const xyzId = converter.getAssetId("other:XYZ");

      assertEquals(abcId, 110000, `test:ABC asset ID should be 110000, but got ${abcId}`);
      assertEquals(xyzId, undefined, `other:XYZ asset ID should be undefined, but got ${xyzId}`);
    });

    await t.step("dexs: true", async () => {
      const converter = await SymbolConverter.create({ transport, dexs: true });

      const abcId = converter.getAssetId("test:ABC");
      assertEquals(abcId, 110000, `test:ABC asset ID should be 110000, but got ${abcId}`);
    });
  });
});
