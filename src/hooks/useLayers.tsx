import { pollutionLayer } from "../layers/pollution"

export const useLayers = () => {
    return [pollutionLayer(255)]
}
