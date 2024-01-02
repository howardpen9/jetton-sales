import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, Sender, SendMode } from 'ton-core';
import { CollectionMint, MintValue } from './helpers/collectionHelpers';
import { encodeOffChainContent } from './helpers/content';
import internal from 'stream';


export type NftCollectionConfig = {
    ownerAddress: Address;
    nextItemIndex: number;
    collectionContent: Cell;
    nftItemCode: Cell;
    minPurchaseTon: bigint;
    priceFactor: bigint;
    priceDevider: bigint;
    availableJettons: bigint;
    jettonMinterAddress: Address;
    jettonWalletCode: Cell;
    // jettonWalletAddress: Address;
    firstUnlockTime: number;
    initialUnlock: number;
    cycleLength: number;
    cyclesNumber: number;
};

export type NftCollectionContent = {
    collectionContent: string;
    commonContent: string;
};


export function buildNftCollectionContentCell(data: NftCollectionContent): Cell {
    let contentCell = beginCell();

    let collectionContent = encodeOffChainContent(data.collectionContent);

    let commonContent = beginCell();
    commonContent.storeStringTail(data.commonContent);

    contentCell.storeRef(collectionContent);
    contentCell.storeRef(commonContent);

    return contentCell.endCell();
}

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    return beginCell()
        .storeAddress(config.ownerAddress)
        .storeUint(config.nextItemIndex, 64)
        .storeRef(config.collectionContent)
        .storeRef(config.nftItemCode)
        .storeCoins(config.minPurchaseTon)
        .storeUint(config.priceFactor, 128)
        .storeUint(config.priceDevider, 128)
        .storeUint(config.firstUnlockTime, 32)
        .storeUint(config.initialUnlock, 16)
        .storeUint(config.cycleLength, 32)
        .storeUint(config.cyclesNumber, 16)
        .storeRef(
            beginCell()
                .storeCoins(config.availableJettons)
                .storeAddress(config.jettonMinterAddress)
                .storeRef(config.jettonWalletCode)
                .storeUint(0, 2)
            .endCell()
        )
        .storeRef(
            beginCell().endCell()
        )
    .endCell();
}

export class NftCollectionWl implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NftCollectionWl(address);
    }

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
        const data = nftCollectionConfigToCell(config);
        const init = { code, data };
        return new NftCollectionWl(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}