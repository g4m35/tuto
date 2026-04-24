from __future__ import annotations

import io
import tarfile
import zipfile

from deeptutor.tools.tex_downloader import TexDownloader


def test_download_rejects_unsafe_arxiv_id_before_request(tmp_path) -> None:
    downloader = TexDownloader(str(tmp_path))

    result = downloader.download_arxiv_source("https://arxiv.org/abs/2501.00001", "../../escape")

    assert result.success is False
    assert result.error == "Invalid ArXiv ID"
    assert not (tmp_path.parent / "paper_..").exists()


def test_extract_tar_skips_path_traversal_and_links(tmp_path) -> None:
    downloader = TexDownloader(str(tmp_path))
    archive = tmp_path / "source.tar"
    extract_dir = tmp_path / "out"
    extract_dir.mkdir()

    with tarfile.open(archive, "w") as tar:
        good_data = b"\\documentclass{article}"
        good = tarfile.TarInfo("paper/main.tex")
        good.size = len(good_data)
        tar.addfile(good, io.BytesIO(good_data))

        evil_data = b"escaped"
        evil = tarfile.TarInfo("../escaped.tex")
        evil.size = len(evil_data)
        tar.addfile(evil, io.BytesIO(evil_data))

        link = tarfile.TarInfo("paper/link.tex")
        link.type = tarfile.SYMTYPE
        link.linkname = "../escaped.tex"
        tar.addfile(link)

    downloader._extract_tar(archive, extract_dir)

    assert (extract_dir / "paper" / "main.tex").read_text() == "\\documentclass{article}"
    assert not (tmp_path / "escaped.tex").exists()
    assert not (extract_dir / "paper" / "link.tex").exists()


def test_extract_zip_skips_path_traversal(tmp_path) -> None:
    downloader = TexDownloader(str(tmp_path))
    archive = tmp_path / "source.zip"
    extract_dir = tmp_path / "out"
    extract_dir.mkdir()

    with zipfile.ZipFile(archive, "w") as zip_file:
        zip_file.writestr("paper/main.tex", "\\documentclass{article}")
        zip_file.writestr("../escaped.tex", "escaped")

    downloader._extract_zip(archive, extract_dir)

    assert (extract_dir / "paper" / "main.tex").read_text() == "\\documentclass{article}"
    assert not (tmp_path / "escaped.tex").exists()
