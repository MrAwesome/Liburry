import {MainDisplayAreaMode} from "./types";

export default class ChaTaigiOptions {
    mainMode: MainDisplayAreaMode = MainDisplayAreaMode.DEFAULT;
    query: string = "";
    debug: boolean = false;
}
