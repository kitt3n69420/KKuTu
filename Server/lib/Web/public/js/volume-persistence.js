/**
 * Volume Settings Persistence Module
 * Handles saving and loading volume settings to/from localStorage
 */

// localStorage 키 정의
var VOLUME_STORAGE_KEYS = {
    BGM_VOLUME: 'kkutu_bgm_volume',
    EFFECT_VOLUME: 'kkutu_effect_volume',
    BGM_MUTE: 'kkutu_bgm_mute',
    EFFECT_MUTE: 'kkutu_effect_mute',
    SOUND_PACK: 'kkutu_sound_pack'
};

/**
 * 볼륨 설정 저장
 */
function saveVolumeSettings(settings) {
    try {
        if (settings.bgmVolume !== undefined) {
            localStorage.setItem(VOLUME_STORAGE_KEYS.BGM_VOLUME, settings.bgmVolume.toString());
        }
        if (settings.effectVolume !== undefined) {
            localStorage.setItem(VOLUME_STORAGE_KEYS.EFFECT_VOLUME, settings.effectVolume.toString());
        }
        if (settings.bgmMute !== undefined) {
            localStorage.setItem(VOLUME_STORAGE_KEYS.BGM_MUTE, settings.bgmMute.toString());
        }
        if (settings.effectMute !== undefined) {
            localStorage.setItem(VOLUME_STORAGE_KEYS.EFFECT_MUTE, settings.effectMute.toString());
        }
        if (settings.soundPack !== undefined) {
            localStorage.setItem(VOLUME_STORAGE_KEYS.SOUND_PACK, settings.soundPack);
        }
    } catch (e) {
        console.warn('Failed to save volume settings to localStorage:', e);
    }
}

/**
 * 볼륨 설정 불러오기
 * null이면 localStorage에 값이 없음을 의미
 */
function loadVolumeSettings() {
    try {
        var bgmVolume = localStorage.getItem(VOLUME_STORAGE_KEYS.BGM_VOLUME);
        var effectVolume = localStorage.getItem(VOLUME_STORAGE_KEYS.EFFECT_VOLUME);
        var bgmMute = localStorage.getItem(VOLUME_STORAGE_KEYS.BGM_MUTE);
        var effectMute = localStorage.getItem(VOLUME_STORAGE_KEYS.EFFECT_MUTE);
        var soundPack = localStorage.getItem(VOLUME_STORAGE_KEYS.SOUND_PACK);

        return {
            bgmVolume: bgmVolume !== null ? parseFloat(bgmVolume) : null,
            effectVolume: effectVolume !== null ? parseFloat(effectVolume) : null,
            bgmMute: bgmMute !== null ? (bgmMute === 'true') : null,
            effectMute: effectMute !== null ? (effectMute === 'true') : null,
            soundPack: soundPack
        };
    } catch (e) {
        console.warn('Failed to load volume settings from localStorage:', e);
        return {
            bgmVolume: null,
            effectVolume: null,
            bgmMute: null,
            effectMute: null,
            soundPack: null
        };
    }
}

/**
 * 개별 볼륨 값 저장 (즉시 저장용)
 */
function saveBGMVolume(volume) {
    saveVolumeSettings({ bgmVolume: volume });
}

function saveEffectVolume(volume) {
    saveVolumeSettings({ effectVolume: volume });
}

function saveBGMMute(mute) {
    saveVolumeSettings({ bgmMute: mute });
}

function saveEffectMute(mute) {
    saveVolumeSettings({ effectMute: mute });
}

function saveSoundPack(pack) {
    saveVolumeSettings({ soundPack: pack });
}
