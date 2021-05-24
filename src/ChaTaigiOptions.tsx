import {MainDisplayAreaMode} from "./types";

export default class ChaTaigiOptions {
    mainMode: MainDisplayAreaMode = MainDisplayAreaMode.HOME;
    query: string = "";
    debug: boolean = false;
}
