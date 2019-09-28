#!/usr/bin/env python

import os

import argparse
import json

import PIL.Image

from typing import Optional

OStr = Optional[str]


class Item:
    def __init__(
        self,
        filename: str,
        basedir: str,
        thumbnail_dir: str,
        nickname: OStr = None,
        description: OStr = None,
        header: OStr = None,
        footer: OStr = None,
    ):
        self.filename = filename
        self.filepath = os.path.join(basedir, filename)
        self.basedir = basedir
        self.thumbdir = thumbnail_dir
        self.nickname = nickname or filename
        self.description = description
        self.header = header
        self.footer = footer

        if not os.path.exists(self.filepath):
            raise ValueError(f"Expected {basedir}/{filename} to exist, but didn't!")

        with open(self.filepath, "rb") as image_fp:
            image = PIL.Image.open(image_fp)
            self.width = image.width
            self.height = image.height

        self.sizes = []
        self.detect_sizes()

    def detect_sizes(self):
        suffix = f"-{self.filename}"
        l_suffix = len(suffix)
        for filename in os.listdir(self.thumbdir):
            if filename.endswith(suffix):
                prefix = filename[0:-l_suffix]
                self.sizes.append(int(prefix))

    def thumbnail_name(self, size):
        return f"{size}-{self.filename}"

    def resize(self, max_size: int):
        height = max_size
        width = int(self.width / self.height * max_size)
        if self.width > self.height:
            width = max_size
            height = self.height / self.width * max_size

        if width > self.width or height > self.height:
            return

        if max_size in self.sizes:
            return

        with open(self.filepath, "rb") as image_fp:
            image = PIL.Image.open(image_fp)
            image.thumbnail((width, height))
            thumbname = self.thumbnail_name(max_size)
            outpath = os.path.join(self.thumbdir, thumbname)
            image.save(outpath, "JPEG")
            self.sizes.append(max_size)

    def serialize(self, image_uri, thumbnail_uri):
        ret = {"filename": self.filename, "width": self.width, "height": self.height}

        if self.nickname and self.nickname != self.filename:
            ret["nickname"] = self.nickname
        if self.description:
            ret["description"] = self.description
        if self.header:
            ret["header"] = self.header
        if self.footer:
            ret["footer"] = self.footer

        ret["thumbs"] = {}
        for size in self.sizes:
            name = self.thumbnail_name(size)
            ret["thumbs"][size] = f"{thumbnail_uri}/{name}"
        ret["src"] = f"{image_uri}/{self.filename}"

        return ret


class lbox:
    def __init__(self, config: str = "img/config.json"):
        self.config_path = config

        if os.path.exists(self.config_path):
            with open(self.config_path, "r") as config_file:
                self.config = json.load(config_file)

            if "image_dir" in self.config:
                self.image_dir = self.config["image_dir"]
            if "image_uri" in self.config:
                self.image_uri = self.config["image_uri"]
            if "thumb_dir" in self.config:
                self.thumb_dir = self.config["thumb_dir"]
            if "thumb_uri" in self.config:
                self.thumb_uri = self.config["thumb_uri"]
        else:
            self.config = {}

        if not "images" in self.config:
            self.config["images"] = []

        if not "sizes" in self.config:
            self.config["sizes"] = [256, 512, 1024, 2048, 3072]

        if not "start" in self.config:
            self.config["start"] = 0

        if not os.path.exists(self.thumb_dir):
            os.mkdir(self.thumb_dir)

    def add_img(self, img: str, nickname: OStr = None):
        img = Item(img, self.image_dir, self.thumb_dir, nickname)
        for size in self.config["sizes"]:
            img.resize(size)

        self.config["images"].append(img.serialize(self.image_uri, self.thumb_uri))

    def save(self):
        with open(self.config_path, "w") as config_file:
            json.dump(self.config, config_file, sort_keys=True, indent=2)
            config_file.write("\n")


def main():
    ctx = lbox()
    ctx.save()


if __name__ == "__main__":
    main()
