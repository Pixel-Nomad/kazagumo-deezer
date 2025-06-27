import {
    KazagumoPlugin as Plugin,
    Kazagumo,
    KazagumoTrack,
    KazagumoError,
} from '@pixel_nomad/kazagumo';
import axios from 'axios';

const API_URL = 'https://api.deezer.com/';
const REGEX = /^https?:\/\/(?:www\.)?deezer\.com\/[a-z]+\/(track|album|playlist)\/(\d+)$/;

export class KazagumoPlugin extends Plugin {
    private _search: Kazagumo["search"] | null = null;
    private kazagumo: Kazagumo | null = null;
    private readonly methods: Record<string, Function>;

    constructor() {
        super();
        this.methods = {
            track: this.getTrack.bind(this),
            album: this.getAlbum.bind(this),
            playlist: this.getPlaylist.bind(this),
        };
    }

    load(kazagumo: Kazagumo): void {
        this.kazagumo = kazagumo;
        this._search = kazagumo.search.bind(kazagumo);
        kazagumo.search = this.search.bind(this);
    }

    async search(query: string, options?: any): Promise<any> {
        if (!this.kazagumo || !this._search) {
            throw new KazagumoError(1, 'kazagumo-deezer is not loaded yet.');
        }

        if (!query) {
            throw new KazagumoError(3, 'Query is required');
        }

        const [, type, id] = REGEX.exec(query) || [];
        const isUrl = /^https?:\/\//.test(query);

        if (type && this.methods[type]) {
            try {
                const _function = this.methods[type];
                const result = await _function(id, options?.requester);
                const loadType = type === 'track' ? 'TRACK' : 'PLAYLIST';
                const playlistName = result.name ?? undefined;
                const tracks = result.tracks.filter(this.filterNullOrUndefined);
                return this.buildSearch(playlistName, tracks, loadType);
            } catch {
                return this.buildSearch(undefined, [], 'SEARCH');
            }
        } else if (options?.engine === 'deezer' && !isUrl) {
            const result = await this.searchTrack(query, options?.requester);
            return this.buildSearch(undefined, result.tracks, 'SEARCH');
        }

        return this._search(query, options);
    }

    private buildSearch(playlistName?: string, tracks: KazagumoTrack[] = [], type?: string): any {
        return {
            playlistName,
            tracks,
            type: type ?? 'TRACK',
        };
    }

    private async searchTrack(query: string, requester?: any): Promise<Result> {
        try {
            const res = await axios
                .get(`${API_URL}/search/track?q=${decodeURIComponent(query)}`);
            return {
                tracks: res.data.data.map((track: any) => this.buildKazagumoTrack(track, requester)),
            };
        } catch (e) {
            throw new Error(e as any);
        }
    }

    private async getTrack(id: string, requester?: any): Promise<Result> {
        try {
            const track = await axios.get(`${API_URL}/track/${id}/`);
            return { tracks: [this.buildKazagumoTrack(track.data, requester)] };
        } catch (e) {
            throw new Error(e as any);
        }
    }

    private async getAlbum(id: string, requester?: any): Promise<Result> {
        try {
            const album = await axios.get(`${API_URL}/album/${id}`);
            const tracks = album.data.tracks.data
                .filter(this.filterNullOrUndefined)
                .map((track: any) => this.buildKazagumoTrack(track, requester));
            return { tracks, name: album.data.title };
        } catch (e) {
            throw new Error(e as any);
        }
    }

    private async getPlaylist(id: string, requester?: any): Promise<Result> {
        try {
            const playlist = await axios.get(`${API_URL}/playlist/${id}`);
            const tracks = playlist.data.tracks.data
                .filter(this.filterNullOrUndefined)
                .map((track: any) => this.buildKazagumoTrack(track, requester));
            return { tracks, name: playlist.data.title };
        } catch (e) {
            throw new Error(e as any);
        }
    }

    private filterNullOrUndefined(obj: any): boolean {
        return obj !== undefined && obj !== null;
    }

    private buildKazagumoTrack(deezerTrack: any, requester?: any): KazagumoTrack {
        return new KazagumoTrack(
            {
                encoded: '',
                info: {
                    sourceName: 'deezer',
                    identifier: String(deezerTrack.id),
                    isSeekable: true,
                    author: deezerTrack.artist?.name ?? 'Unknown',
                    length: deezerTrack.duration * 1000,
                    isStream: false,
                    position: 0,
                    title: deezerTrack.title,
                    uri: `https://www.deezer.com/track/${deezerTrack.id}`,
                    artworkUrl: deezerTrack.album?.cover ?? ''
                },
                pluginInfo: null,
            },
            requester
        );
    }
}

// Interfaces based on plugin.d.ts

export interface Result {
    tracks: KazagumoTrack[];
    name?: string;
}

export interface Album {
    title: string;
    tracks: AlbumTracks;
}

export interface AlbumTracks {
    data: DeezerTrack[];
    next: string | null;
}

export interface Artist {
    name: string;
}

export interface Playlist {
    tracks: PlaylistTracks;
    title: string;
}

export interface PlaylistTracks {
    data: DeezerTrack[];
    next: string | null;
}

export interface DeezerTrack {
    data: KazagumoTrack[];
}

export interface SearchResult {
    exception?: {
        severity: string;
        message: string;
    };
    loadType: string;
    playlist?: {
        duration_ms: number;
        name: string;
    };
    data: KazagumoTrack[];
}
