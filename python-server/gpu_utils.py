"""
GPU 감지 및 설정 유틸리티
Apple Silicon Mac에서 최적화된 Whisper 성능을 위한 설정
"""

import logging
import platform

logger = logging.getLogger(__name__)

def is_apple_silicon() -> bool:
    """Apple Silicon Mac인지 확인"""
    return platform.processor() == 'arm' and platform.system() == 'Darwin'

def detect_gpu_device() -> str:
    """
    사용 가능한 GPU 디바이스를 감지하여 반환
    Apple Silicon Mac에서는 설정에 따라 MPS 사용 여부 결정
    """
    try:
        import torch
        from constants import USE_MPS_ON_APPLE_SILICON
        
        # Apple Silicon Mac 확인
        if is_apple_silicon():
            logger.info("Apple Silicon Mac 감지됨")
            
            # MPS 사용 설정 확인
            if USE_MPS_ON_APPLE_SILICON:
                # Metal Performance Shaders (Apple Silicon) 확인
                if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                    device = "mps"
                    logger.info("Metal GPU (MPS) 사용 가능 - Apple Silicon 최적화 모드")
                    return device
                else:
                    logger.warning("Apple Silicon Mac이지만 MPS를 사용할 수 없음")
            else:
                logger.info("Apple Silicon Mac에서 MPS 사용이 비활성화됨, CPU 사용")
                return "cpu"
        
        # CUDA (NVIDIA GPU) 확인
        if torch.cuda.is_available():
            device = "cuda"
            gpu_name = torch.cuda.get_device_name(0)
            logger.info(f"CUDA GPU 감지됨: {gpu_name}")
            return device
        
        # Metal Performance Shaders (일반 macOS)
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            device = "mps"
            logger.info("Metal GPU (MPS) 감지됨")
            return device
        
        # CPU 사용
        else:
            device = "cpu"
            logger.info("GPU 없음, CPU 사용")
            return device
            
    except ImportError:
        logger.warning("torch 모듈을 불러올 수 없음, CPU 사용")
        return "cpu"
    except Exception as e:
        logger.warning(f"GPU 감지 중 오류 발생: {e}")
        logger.info("CPU 사용으로 폴백")
        return "cpu"

def test_mps_stability() -> bool:
    """
    MPS 백엔드의 안정성을 테스트
    """
    try:
        import torch
        if not (hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()):
            return False
            
        # 기본 텐서 연산 테스트
        test_tensor = torch.randn(2, 2, device="mps")
        result = test_tensor + test_tensor
        
        # Whisper에서 사용하는 연산들 테스트
        # 1. Float16 연산 테스트
        float16_tensor = torch.randn(1, 1, dtype=torch.float16, device="mps")
        _ = float16_tensor * 2.0
        
        # 2. 복잡한 연산 테스트
        complex_tensor = torch.randn(10, 10, device="mps")
        _ = torch.matmul(complex_tensor, complex_tensor.T)
        
        logger.info("MPS 안정성 테스트 통과")
        return True
        
    except ImportError:
        logger.warning("torch 모듈을 불러올 수 없음")
        return False
    except Exception as e:
        logger.warning(f"MPS 안정성 테스트 실패: {e}")
        return False

def get_optimal_device() -> str:
    """
    최적의 디바이스를 반환
    Apple Silicon Mac에서는 MPS를 우선적으로 고려
    """
    from constants import ENABLE_GPU, GPU_DEVICE
    
    if not ENABLE_GPU:
        logger.info("GPU 사용이 비활성화됨, CPU 사용")
        return "cpu"
    
    if GPU_DEVICE == "auto":
        return detect_gpu_device()
    elif GPU_DEVICE in ["cuda", "mps", "cpu"]:
        # 요청된 디바이스가 사용 가능한지 확인
        try:
            import torch
            if GPU_DEVICE == "cuda" and not torch.cuda.is_available():
                logger.warning("CUDA 요청되었지만 사용 불가능, CPU로 폴백")
                return "cpu"
            elif GPU_DEVICE == "mps" and not (hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()):
                logger.warning("MPS 요청되었지만 사용 불가능, CPU로 폴백")
                return "cpu"
        except ImportError:
            logger.warning("torch 모듈을 불러올 수 없음, CPU로 폴백")
            return "cpu"
        else:
            return GPU_DEVICE
    else:
        logger.warning(f"알 수 없는 디바이스: {GPU_DEVICE}, CPU 사용")
        return "cpu"

def get_safe_device() -> str:
    """
    안전한 디바이스를 반환 (MPS 오류 시 CPU로 폴백)
    Apple Silicon Mac에서 최적화된 처리
    """
    device = get_optimal_device()
    
    # MPS 디바이스인 경우 안전성 확인
    if device == "mps":
        if test_mps_stability():
            return device
        else:
            logger.warning("MPS 안정성 테스트 실패, CPU로 폴백")
            return "cpu"
    
    return device

def get_device_info() -> dict:
    """
    현재 디바이스 정보를 반환
    """
    # Simplified device detection for whisper.cpp Metal
    info = {
        "device": "Metal GPU (whisper.cpp)" if is_apple_silicon() else "CPU",
        "gpu_available": is_apple_silicon(),
        "gpu_name": "Apple Metal GPU (whisper.cpp)" if is_apple_silicon() else None,
        "memory_info": None,
        "platform": platform.system(),
        "processor": platform.processor(),
        "is_apple_silicon": is_apple_silicon()
    }
    
    try:
        import torch
        device = get_safe_device()
        info["device"] = device
        
        if device == "cuda":
            info["gpu_available"] = True
            info["gpu_name"] = torch.cuda.get_device_name(0)
            info["memory_info"] = {
                "total": torch.cuda.get_device_properties(0).total_memory,
                "allocated": torch.cuda.memory_allocated(0),
                "cached": torch.cuda.memory_reserved(0)
            }
        elif device == "mps":
            info["gpu_available"] = True
            info["gpu_name"] = "Apple Metal GPU (MPS)"
    except ImportError:
        # torch not available, use simplified detection
        pass
    
    return info

def log_device_info():
    """디바이스 정보를 로그에 출력"""
    info = get_device_info()
    logger.info(f"플랫폼: {info['platform']} ({info['processor']})")
    logger.info(f"Apple Silicon: {'예' if info['is_apple_silicon'] else '아니오'}")
    logger.info(f"사용 디바이스: {info['device']}")
    
    if info['gpu_available']:
        logger.info(f"GPU 이름: {info['gpu_name']}")
        if info['memory_info']:
            total_gb = info['memory_info']['total'] / (1024**3)
            allocated_gb = info['memory_info']['allocated'] / (1024**3)
            logger.info(f"GPU 메모리: {allocated_gb:.2f}GB / {total_gb:.2f}GB 사용 중")
    else:
        logger.info("CPU 모드로 실행 중")
    
    # Apple Silicon 최적화 정보
    if info['is_apple_silicon'] and info['device'] == 'mps':
        logger.info("🚀 Apple Silicon 최적화 모드 활성화")
    elif info['is_apple_silicon'] and info['device'] == 'cpu':
        logger.info("⚠️ Apple Silicon Mac이지만 CPU 모드로 실행 중") 