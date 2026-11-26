package com.dentsbackend.services;

import com.dentsbackend.dao.IDao;
import com.dentsbackend.entities.PW;
import com.dentsbackend.entities.Tooth;
import com.dentsbackend.repositories.PWRepository;
import com.dentsbackend.repositories.ToothRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ToothService implements IDao<Tooth> {
    @Autowired
    ToothRepository toothRepository;

    @Autowired
    PWRepository pwRepository;

    @Override
    public Tooth create(Tooth o) {
        return toothRepository.save(o);
    }

    @Override
    public Tooth update(Tooth o) {
        return toothRepository.save(o);
    }

    @Override
    public Tooth findById(long id) {
        return toothRepository.findById(id).orElse(null);
    }

    @Override
    public List<Tooth> findAll() {
        return toothRepository.findAll();
    }

    public List<PW> findReferencingPWs(long toothId) {
        return pwRepository.findByToothId(toothId);
    }

    @Override
    public boolean delete(Tooth o) {
        try {
            toothRepository.delete(o);
            toothRepository.flush();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
